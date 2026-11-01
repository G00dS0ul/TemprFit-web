import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WorkoutSession from '@/models/WorkoutSession';
import PersonalRecord from '@/models/PersonalRecord';
import WeeklyReport from '@/models/WeeklyReport';
import {
  askGemini,
  GeminiConfigError,
  GeminiRequestError,
} from '@/lib/gemini';
import { displayName } from '@/lib/utils';
import {
  weeklyReportGetResponseSchema,
  weeklyReportPostRequestSchema,
  weeklyReportPostResponseSchema,
} from '@/lib/contracts/v1/progress';

export const dynamic = 'force-dynamic';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function mondayOf(date) {
  const result = new Date(date);
  const day = result.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  result.setUTCDate(result.getUTCDate() + diff);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function parseJsonLoose(text) {
  return JSON.parse(text.replace(/```json/gi, '').replace(/```/g, '').trim());
}

async function gatherWeekData(user, weekStart) {
  const weekEnd = new Date(weekStart.getTime() + WEEK_MS);
  const previousWeekStart = new Date(weekStart.getTime() - WEEK_MS);

  const sessions = await WorkoutSession.find({
    user: user._id,
    status: 'completed',
    completedAt: { $gte: weekStart, $lt: weekEnd },
  }).select('name completedAt durationSeconds totalVolume prCount').lean();

  const previousWeekSessions = await WorkoutSession.find({
    user: user._id,
    status: 'completed',
    completedAt: { $gte: previousWeekStart, $lt: weekStart },
  }).select('totalVolume').lean();

  const personalRecords = await PersonalRecord.find({
    user: user._id,
    achievedAt: { $gte: weekStart, $lt: weekEnd },
  }).populate('exercise', 'name').select('weight reps estOneRepMax achievedAt').lean();

  return {
    sessions,
    personalRecords,
    totalVolume: sessions.reduce((sum, item) => sum + (item.totalVolume || 0), 0),
    previousVolume: previousWeekSessions.reduce(
      (sum, item) => sum + (item.totalVolume || 0),
      0
    ),
  };
}

export async function GET() {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const weekStart = mondayOf(new Date());
    const report = await WeeklyReport.findOne({ user: user._id, weekStart }).lean();
    const validated = weeklyReportGetResponseSchema.parse({
      report: report || null,
      weekStart,
    });
    return NextResponse.json(validated);
  } catch (error) {
    console.error('[v1/progress/weekly-report] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve weekly report.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const rawBody = await request.text();
    let body = {};
    if (rawBody.trim()) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON request body.' },
          { status: 400 }
        );
      }
    }
    const parsedRequest = weeklyReportPostRequestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: 'Weekly report generation accepts no request fields.', details: parsedRequest.error.format() },
        { status: 400 }
      );
    }

    const weekStart = mondayOf(new Date());
    const {
      sessions,
      personalRecords,
      totalVolume,
      previousVolume,
    } = await gatherWeekData(user, weekStart);

    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'No completed workouts this week yet - finish a session first, then generate your report.' },
        { status: 422 }
      );
    }

    const volumeTrendPct = previousVolume > 0
      ? Math.round(((totalVolume - previousVolume) / previousVolume) * 100)
      : null;
    const sessionsGoal = user.goals?.weeklySessions ?? 4;
    const sessionLines = sessions.map((session) => (
      `- ${session.name}: ${Math.round((session.durationSeconds || 0) / 60)}min, ${session.totalVolume || 0} volume, ${session.prCount || 0} PR(s)`
    )).join('\n');
    const personalRecordLines = personalRecords.length > 0
      ? personalRecords.map((record) => (
        `- ${record.exercise?.name || 'exercise'}: ${record.weight}x${record.reps} (est. 1RM ${record.estOneRepMax})`
      )).join('\n')
      : 'None this week.';

    const systemPrompt = `You are TemprFit's weekly report writer. Respond with ONLY raw JSON, no markdown fences, in exactly this shape:
{"summary": "2-3 sentence factual, encouraging recap of THIS week using only the data given", "recommendation": "1-2 sentence specific, actionable suggestion for next week based on this data"}
Never invent numbers or exercises not in the data. Be honest - if the week was light, say so plainly rather than overselling it.`;

    const userMessage = `Name: ${displayName(user)}
Stated goal: ${user.goal || 'not set'}
Weekly session target: ${sessionsGoal}
Sessions completed this week: ${sessions.length}
Total volume this week: ${totalVolume}
Volume vs last week: ${volumeTrendPct === null ? 'no data for last week' : `${volumeTrendPct > 0 ? '+' : ''}${volumeTrendPct}%`}

Sessions this week:
${sessionLines}

New PRs this week:
${personalRecordLines}`;

    let parsedReport;
    try {
      const raw = await askGemini({ systemPrompt, history: [], userMessage });
      parsedReport = parseJsonLoose(raw);
    } catch (error) {
      const status = error instanceof GeminiConfigError
        ? 500
        : error instanceof GeminiRequestError
          ? 502
          : error instanceof SyntaxError
            ? 502
            : 500;
      return NextResponse.json(
        { error: error.message || 'Could not generate the report.' },
        { status }
      );
    }

    if (typeof parsedReport?.summary !== 'string' ||
        !parsedReport.summary.trim() ||
        typeof parsedReport?.recommendation !== 'string' ||
        !parsedReport.recommendation.trim()) {
      return NextResponse.json(
        { error: 'The AI response could not be parsed. Try again.' },
        { status: 502 }
      );
    }

    const report = await WeeklyReport.findOneAndUpdate(
      { user: user._id, weekStart },
      {
        $set: {
          summary: parsedReport.summary.trim().slice(0, 800),
          recommendation: parsedReport.recommendation.trim().slice(0, 500),
          statsSnapshot: {
            sessionsCompleted: sessions.length,
            totalVolume,
            newPRs: personalRecords.length,
            sessionsGoal,
          },
        },
      },
      { upsert: true, new: true }
    ).lean();

    const validated = weeklyReportPostResponseSchema.parse({ report });
    return NextResponse.json(validated);
  } catch (error) {
    console.error('[v1/progress/weekly-report] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate weekly report.' },
      { status: 500 }
    );
  }
}
