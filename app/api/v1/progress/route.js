import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WorkoutSession from '@/models/WorkoutSession';
import PersonalRecord from '@/models/PersonalRecord';
import Exercise from '@/models/Exercise';
import {
  progressQuerySchema,
  progressResponseSchema,
} from '@/lib/contracts/v1/progress';

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 12;

function weekLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = progressQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid progress query.', details: parsedQuery.error.format() },
        { status: 400 }
      );
    }
    const requestedSlug = parsedQuery.data.exercise;

    const now = new Date();

    const completedSessions = await WorkoutSession.find({
      user: user._id,
      status: 'completed',
    })
      .sort({ completedAt: 1 })
      .lean();

    const volumeByWeek = [];
    const sessionsByWeek = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * DAY_MS);
      const weekEnd = new Date(now.getTime() - i * 7 * DAY_MS);
      const inWeek = completedSessions.filter((s) => {
        const d = s.completedAt && new Date(s.completedAt);
        return d && d >= weekStart && d < weekEnd;
      });
      const label = weekLabel(weekEnd);
      volumeByWeek.push({ label, value: inWeek.reduce((sum, s) => sum + (s.totalVolume || 0), 0) });
      sessionsByWeek.push({ label, value: inWeek.length });
    }

    const allPRs = await PersonalRecord.find({ user: user._id })
      .sort({ achievedAt: 1 })
      .populate('exercise', 'name slug')
      .lean();

    const exerciseOptionsMap = new Map();
    for (const pr of allPRs) {
      if (pr.exercise) exerciseOptionsMap.set(pr.exercise.slug, pr.exercise.name);
    }
    const exerciseOptions = Array.from(exerciseOptionsMap, ([slug, name]) => ({ slug, name }));

    const selectedSlug = requestedSlug
      || user.goals?.targetExerciseSlug
      || (exerciseOptions[0]?.slug ?? null);
    let strengthTrend = [];
    let currentBest1RM = null;
    let selectedExerciseName = null;

    if (selectedSlug) {
      const selectedExercise = await Exercise.findOne({ slug: selectedSlug }).select('_id name').lean();
      if (selectedExercise) {
        selectedExerciseName = selectedExercise.name;
        const prsForExercise = allPRs.filter(
          (p) => p.exercise?._id?.toString() === selectedExercise._id.toString()
        );
        strengthTrend = prsForExercise.map((p) => ({
          achievedAt: p.achievedAt,
          estOneRepMax: p.estOneRepMax,
          weight: p.weight,
          reps: p.reps,
        }));
        if (strengthTrend.length) {
          currentBest1RM = Math.max(...strengthTrend.map((p) => p.estOneRepMax));
        }
      }
    }

    const strengthHistory = allPRs
      .filter((pr) => pr.exercise?.slug === selectedSlug)
      .map((pr) => ({
        label: new Date(pr.achievedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        value: pr.estOneRepMax,
        weight: pr.weight,
        reps: pr.reps,
      }));

    const totalVolumeAllTime = completedSessions.reduce(
      (sum, session) => sum + (session.totalVolume || 0),
      0
    );
    const totalTimeSeconds = completedSessions.reduce((sum, session) => {
      if (!session.startedAt || !session.completedAt) return sum;
      return sum + Math.max(
        0,
        (new Date(session.completedAt) - new Date(session.startedAt)) / 1000
      );
    }, 0);
    const totalTimeMinutes = Math.round(totalTimeSeconds / 60);

    const payload = {
      hasHistory: completedSessions.length > 0,
      totalSessions: completedSessions.length,
      totalVolumeAllTime,
      totalPRs: allPRs.length,
      totalTimeMinutes,
      totalCaloriesBurned: Math.round(totalTimeMinutes * 6.5),
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      volumeByWeek,
      sessionsByWeek,
      exerciseOptions,
      activeExerciseSlug: selectedSlug,
      strengthHistory,
      goals: user.goals || {},
      strengthTrend,
      currentBest1RM,
      selectedExerciseName,
    };

    const validated = progressResponseSchema.parse(payload);
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/progress] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve progress data.' }, { status: 500 });
  }
}
