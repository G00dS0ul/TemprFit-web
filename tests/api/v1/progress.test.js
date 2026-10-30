import './../../setup.js';
import {
  afterEach,
  beforeEach,
  describe,
  it,
  mock,
} from 'node:test';
import assert from 'node:assert/strict';
import { GET as progressGet } from '@/app/api/v1/progress/route.js';
import {
  GET as weeklyReportGet,
  POST as weeklyReportPost,
} from '@/app/api/v1/progress/weekly-report/route.js';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';
import PersonalRecord from '@/models/PersonalRecord';
import Exercise from '@/models/Exercise';
import WeeklyReport from '@/models/WeeklyReport';
import { signToken } from '@/lib/auth';
import {
  progressResponseSchema,
  weeklyReportGetResponseSchema,
  weeklyReportPostResponseSchema,
} from '@/lib/contracts/v1/progress';
import {
  clearMockCookies,
  clearMockHeaders,
  setMockHeaders,
} from './../../mocks/next-headers.js';

function queryResult(value) {
  return {
    sort() { return this; },
    populate() { return this; },
    select() { return this; },
    limit() { return this; },
    lean: async () => value,
  };
}

function authenticate(user) {
  setMockHeaders({
    authorization: `Bearer ${signToken({ userId: user._id })}`,
  });
  mock.method(User, 'findById', async () => user);
}

function successfulGeminiResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
    text: async () => '',
  };
}

async function assertFlatErrorEnvelope(response, {
  status,
  error,
  hasDetails = false,
} = {}) {
  assert.equal(response.status, status);
  const body = await response.json();
  assert.equal(typeof body.error, 'string');
  if (error !== undefined) assert.equal(body.error, error);
  assert.deepEqual(
    Object.keys(body).sort(),
    hasDetails ? ['details', 'error'] : ['error']
  );
  return body;
}

describe('API v1 Progress contracts and handlers', () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Progress Tester',
    email: 'progress@example.com',
    role: 'user',
    plan: 'free',
    currentStreak: 4,
    longestStreak: 9,
    goals: {
      targetExerciseSlug: 'barbell-squat',
      weeklySessions: 4,
    },
  };

  beforeEach(() => {
    clearMockCookies();
    clearMockHeaders();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  afterEach(() => {
    mock.restoreAll();
    clearMockCookies();
    clearMockHeaders();
    if (originalGeminiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = originalGeminiKey;
    }
  });

  it('parses the complete additive Progress and weekly-report response fixtures', () => {
    const chart = Array.from({ length: 12 }, (_, index) => ({
      label: `Week ${index + 1}`,
      value: index,
    }));
    const progress = progressResponseSchema.parse({
      hasHistory: true,
      totalSessions: 3,
      totalVolumeAllTime: 4500,
      totalPRs: 1,
      totalTimeMinutes: 90,
      totalCaloriesBurned: 585,
      currentStreak: 4,
      longestStreak: 9,
      volumeByWeek: chart,
      sessionsByWeek: chart,
      exerciseOptions: [{ slug: 'barbell-squat', name: 'Barbell Squat' }],
      activeExerciseSlug: 'barbell-squat',
      strengthHistory: [{ label: 'Oct 1', value: 120, weight: 100, reps: 5 }],
      goals: { weeklySessions: 4 },
      strengthTrend: [{
        achievedAt: '2026-10-01T00:00:00.000Z',
        estOneRepMax: 120,
        weight: 100,
        reps: 5,
      }],
      currentBest1RM: 120,
      selectedExerciseName: 'Barbell Squat',
    });
    assert.equal(progress.volumeByWeek.length, 12);

    const report = {
      weekStart: '2026-10-26T00:00:00.000Z',
      summary: 'A focused week.',
      recommendation: 'Add one recovery session.',
      statsSnapshot: {
        sessionsCompleted: 3,
        totalVolume: 4500,
        newPRs: 1,
        sessionsGoal: 4,
      },
    };
    assert(weeklyReportGetResponseSchema.parse({ report, weekStart: report.weekStart }));
    assert(weeklyReportPostResponseSchema.parse({ report }));
    assert.throws(() => progressResponseSchema.parse({ ...progress, volumeByWeek: [] }));
    assert.throws(() => weeklyReportPostResponseSchema.parse({
      report: { ...report, summary: undefined },
    }));
  });

  it('returns complete full-history analytics and uses the goal exercise fallback', async () => {
    authenticate(user);
    const now = Date.now();
    const sessions = [
      {
        completedAt: new Date(now - (10 * 24 * 60 * 60 * 1000)),
        startedAt: new Date(now - (10 * 24 * 60 * 60 * 1000) - (60 * 60 * 1000)),
        totalVolume: 3200,
      },
      {
        completedAt: new Date(now - (3 * 24 * 60 * 60 * 1000)),
        startedAt: new Date(now - (3 * 24 * 60 * 60 * 1000) - (30 * 60 * 1000)),
        totalVolume: 1800,
      },
    ];
    const exercise = {
      _id: '507f1f77bcf86cd799439012',
      slug: 'barbell-squat',
      name: 'Barbell Squat',
    };
    const records = [{
      exercise,
      achievedAt: '2026-10-27T10:30:00.000Z',
      estOneRepMax: 120,
      weight: 100,
      reps: 5,
    }];

    mock.method(WorkoutSession, 'find', () => queryResult(sessions));
    mock.method(PersonalRecord, 'find', () => queryResult(records));
    mock.method(Exercise, 'findOne', () => queryResult(exercise));

    const response = await progressGet(new Request('http://localhost/api/v1/progress'));
    assert.equal(response.status, 200);
    const json = await response.json();
    assert.equal(json.hasHistory, true);
    assert.equal(json.totalSessions, 2);
    assert.equal(json.totalVolumeAllTime, 5000);
    assert.equal(json.totalPRs, 1);
    assert.equal(json.totalTimeMinutes, 90);
    assert.equal(json.totalCaloriesBurned, 585);
    assert.equal(json.activeExerciseSlug, 'barbell-squat');
    assert.equal(json.selectedExerciseName, 'Barbell Squat');
    assert.equal(json.strengthHistory.length, 1);
    assert.equal(json.strengthTrend.length, 1);
    assert.equal(json.volumeByWeek.length, 12);
    assert.equal(json.sessionsByWeek.length, 12);
    assert.deepEqual(
      json.volumeByWeek.map((point) => point.label),
      json.sessionsByWeek.map((point) => point.label)
    );
    assert.deepEqual(
      json.volumeByWeek.map((point) => point.value),
      [...Array(10).fill(0), 3200, 1800]
    );
    assert.deepEqual(
      json.sessionsByWeek.map((point) => point.value),
      [...Array(10).fill(0), 1, 1]
    );
  });

  it('prefers an explicit exercise and returns safe empty-history analytics', async () => {
    authenticate({ ...user, goals: { targetExerciseSlug: 'barbell-squat' } });
    const deadlift = {
      _id: '507f1f77bcf86cd799439013',
      slug: 'deadlift',
      name: 'Deadlift',
    };
    const records = [{
      exercise: deadlift,
      achievedAt: '2026-10-01T00:00:00.000Z',
      estOneRepMax: 180,
      weight: 160,
      reps: 3,
    }];
    mock.method(WorkoutSession, 'find', () => queryResult([]));
    mock.method(PersonalRecord, 'find', () => queryResult(records));
    mock.method(Exercise, 'findOne', () => queryResult(deadlift));

    const response = await progressGet(
      new Request('http://localhost/api/v1/progress?exercise=deadlift')
    );
    assert.equal(response.status, 200);
    const json = await response.json();
    assert.equal(json.hasHistory, false);
    assert.equal(json.activeExerciseSlug, 'deadlift');
    assert.equal(json.currentBest1RM, 180);
    assert.equal(json.totalSessions, 0);
    assert.equal(json.volumeByWeek.length, 12);
    assert.deepEqual(json.volumeByWeek.map((point) => point.value), Array(12).fill(0));
    assert.deepEqual(json.sessionsByWeek.map((point) => point.value), Array(12).fill(0));
  });

  it('falls back to the first PR exercise when no query or goal target exists', async () => {
    authenticate({ ...user, goals: {} });
    const benchPress = {
      _id: '507f1f77bcf86cd799439014',
      slug: 'bench-press',
      name: 'Bench Press',
    };
    const records = [{
      exercise: benchPress,
      achievedAt: '2026-10-02T00:00:00.000Z',
      estOneRepMax: 100,
      weight: 90,
      reps: 4,
    }];
    mock.method(WorkoutSession, 'find', () => queryResult([]));
    mock.method(PersonalRecord, 'find', () => queryResult(records));
    mock.method(Exercise, 'findOne', () => queryResult(benchPress));

    const response = await progressGet(new Request('http://localhost/api/v1/progress'));
    assert.equal(response.status, 200);
    const json = await response.json();
    assert.equal(json.activeExerciseSlug, 'bench-press');
    assert.equal(json.selectedExerciseName, 'Bench Press');
  });

  it('rejects undeclared Progress query fields and maps data failures to 500', async () => {
    authenticate(user);
    const invalidQueryResponse = await progressGet(
      new Request('http://localhost/api/v1/progress?unexpected=true')
    );
    await assertFlatErrorEnvelope(invalidQueryResponse, {
      status: 400,
      error: 'Invalid progress query.',
      hasDetails: true,
    });

    mock.restoreAll();
    authenticate(user);
    mock.method(WorkoutSession, 'find', () => {
      throw new Error('database unavailable');
    });
    const failedResponse = await progressGet(
      new Request('http://localhost/api/v1/progress')
    );
    await assertFlatErrorEnvelope(failedResponse, {
      status: 500,
      error: 'Failed to retrieve progress data.',
    });
  });

  it('returns 401 for unauthenticated Progress and weekly-report requests', async () => {
    const progressResponse = await progressGet(
      new Request('http://localhost/api/v1/progress')
    );
    await assertFlatErrorEnvelope(progressResponse, {
      status: 401,
      error: 'Sign in required.',
    });
    const weeklyResponse = await weeklyReportGet();
    await assertFlatErrorEnvelope(weeklyResponse, {
      status: 401,
      error: 'Sign in required.',
    });
    const weeklyPostResponse = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      { method: 'POST' }
    ));
    await assertFlatErrorEnvelope(weeklyPostResponse, {
      status: 401,
      error: 'Sign in required.',
    });
  });

  it('returns cached or missing weekly reports from GET', async () => {
    authenticate(user);
    const cached = {
      weekStart: new Date('2026-10-26T00:00:00.000Z'),
      summary: 'Three productive sessions.',
      recommendation: 'Keep the same cadence.',
      statsSnapshot: {
        sessionsCompleted: 3,
        totalVolume: 4200,
        newPRs: 1,
        sessionsGoal: 4,
      },
    };
    const values = [cached, null];
    mock.method(WeeklyReport, 'findOne', () => queryResult(values.shift()));

    const cachedResponse = await weeklyReportGet();
    assert.equal(cachedResponse.status, 200);
    assert.equal((await cachedResponse.json()).report.summary, cached.summary);

    const missingResponse = await weeklyReportGet();
    assert.equal(missingResponse.status, 200);
    assert.equal((await missingResponse.json()).report, null);
  });

  it('rejects non-empty weekly-report POST bodies at the strict boundary', async () => {
    authenticate(user);
    const response = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: 'override' }),
      }
    ));
    await assertFlatErrorEnvelope(response, {
      status: 400,
      error: 'Weekly report generation accepts no request fields.',
      hasDetails: true,
    });
  });

  it('rejects malformed weekly-report JSON instead of treating it as an empty body', async () => {
    authenticate(user);
    const response = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{not-json',
      }
    ));
    await assertFlatErrorEnvelope(response, {
      status: 400,
      error: 'Invalid JSON request body.',
    });
  });

  it('returns 422 when the current week has no completed workout', async () => {
    authenticate(user);
    mock.method(WorkoutSession, 'find', () => queryResult([]));
    mock.method(PersonalRecord, 'find', () => queryResult([]));

    const response = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      { method: 'POST' }
    ));
    await assertFlatErrorEnvelope(response, {
      status: 422,
      error: 'No completed workouts this week yet - finish a session first, then generate your report.',
    });
  });

  it('generates and persists a weekly report with a server-side Gemini call', async () => {
    authenticate(user);
    let workoutCall = 0;
    let upsertCall = 0;
    mock.method(WorkoutSession, 'find', () => {
      workoutCall += 1;
      return queryResult(workoutCall % 2 === 1
        ? [{ name: 'Strength Day', durationSeconds: 3600, totalVolume: 5000, prCount: 1 }]
        : [{ totalVolume: 4000 }]);
    });
    mock.method(PersonalRecord, 'find', () => queryResult([{
      exercise: { name: 'Barbell Squat' },
      weight: 100,
      reps: 5,
      estOneRepMax: 120,
    }]));
    mock.method(globalThis, 'fetch', async () => successfulGeminiResponse({
      summary: 'You completed a strong strength session.',
      recommendation: 'Add one recovery-focused workout next week.',
    }));
    mock.method(WeeklyReport, 'findOneAndUpdate', (query, update) => {
      upsertCall += 1;
      return queryResult({
        weekStart: query.weekStart,
        ...update.$set,
      });
    });

    const response = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      { method: 'POST' }
    ));
    assert.equal(response.status, 200);
    const json = await response.json();
    assert.equal(json.report.statsSnapshot.sessionsCompleted, 1);
    assert.equal(json.report.statsSnapshot.totalVolume, 5000);
    assert.equal(json.report.statsSnapshot.newPRs, 1);

    const regenerateResponse = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      { method: 'POST' }
    ));
    assert.equal(regenerateResponse.status, 200);
    assert.equal(upsertCall, 2);
  });

  it('maps missing Gemini configuration to 500 and request failure to 502', async () => {
    authenticate(user);
    let workoutCall = 0;
    mock.method(WorkoutSession, 'find', () => {
      workoutCall += 1;
      return queryResult(workoutCall % 2 === 1
        ? [{ name: 'Workout', durationSeconds: 1200, totalVolume: 1000, prCount: 0 }]
        : []);
    });
    mock.method(PersonalRecord, 'find', () => queryResult([]));

    delete process.env.GEMINI_API_KEY;
    const configResponse = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      { method: 'POST' }
    ));
    await assertFlatErrorEnvelope(configResponse, {
      status: 500,
      error: 'GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com and add it to .env.local.',
    });

    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('offline');
    });
    const requestResponse = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      { method: 'POST' }
    ));
    await assertFlatErrorEnvelope(requestResponse, {
      status: 502,
      error: 'Could not reach Gemini: offline',
    });
  });

  it('rejects invalid AI report fields before writing the cached report', async () => {
    authenticate(user);
    mock.method(WorkoutSession, 'find', () => queryResult([{
      name: 'Workout', durationSeconds: 1200, totalVolume: 1000, prCount: 0,
    }]));
    mock.method(PersonalRecord, 'find', () => queryResult([]));
    const persist = mock.method(WeeklyReport, 'findOneAndUpdate', () => {
      throw new Error('Invalid report must never be persisted');
    });

    for (const report of [
      { summary: { text: 'Invalid' }, recommendation: 'Recover' },
      { summary: 'Workout completed', recommendation: 123 },
      { summary: '   ', recommendation: 'Recover' },
    ]) {
      mock.method(globalThis, 'fetch', async () => successfulGeminiResponse(report));
      const response = await weeklyReportPost(new Request(
        'http://localhost/api/v1/progress/weekly-report',
        { method: 'POST' }
      ));
      await assertFlatErrorEnvelope(response, { status: 502 });
    }
    assert.equal(persist.mock.callCount(), 0);
  });

  it('maps malformed Gemini JSON to the 502 parse error envelope', async () => {
    authenticate(user);
    let workoutCall = 0;
    mock.method(WorkoutSession, 'find', () => {
      workoutCall += 1;
      return queryResult(workoutCall === 1
        ? [{ name: 'Workout', durationSeconds: 1200, totalVolume: 1000, prCount: 0 }]
        : []);
    });
    mock.method(PersonalRecord, 'find', () => queryResult([]));
    mock.method(globalThis, 'fetch', async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'not-json' }] } }],
      }),
      text: async () => '',
    }));

    const response = await weeklyReportPost(new Request(
      'http://localhost/api/v1/progress/weekly-report',
      { method: 'POST' }
    ));
    await assertFlatErrorEnvelope(response, { status: 502 });
  });
});
