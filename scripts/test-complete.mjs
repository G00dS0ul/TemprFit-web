import mongoose from 'mongoose';
import WorkoutSession from '../models/WorkoutSession.js';
import User from '../models/User.js';
import PersonalRecord from '../models/PersonalRecord.js';
import path from 'path';
import fs from 'fs';
import { estOneRepMax, computeVolume } from '../lib/workout-utils.js';
import { updateStreak } from '../lib/streak.js';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal();

// mock detectAndRecordPRs since we can't import it easily without aliases
async function detectAndRecordPRs({ userId, sessionId, exercises }) {
  let prCount = 0;
  for (const ex of exercises || []) {
    let bestThisExercise = 0;
    let bestSet = null;
    for (const set of ex.sets || []) {
      if (!set.completed || !set.weight || !set.reps) continue;
      const est = estOneRepMax(set.weight, set.reps);
      if (est > bestThisExercise) {
        bestThisExercise = est;
        bestSet = set;
      }
    }
    if (!bestSet || bestThisExercise <= 0) continue;
    const priorBest = await PersonalRecord.findOne({ user: userId, exercise: ex.exercise }).sort({ estOneRepMax: -1 }).select('estOneRepMax').lean();
    if (!priorBest || bestThisExercise > priorBest.estOneRepMax) {
      // NOTE: ex.exercise might be an object here if it was set from frontend body!
      await PersonalRecord.create({
        user: userId,
        exercise: ex.exercise._id || ex.exercise, // safely extract _id
        session: sessionId,
        weight: bestSet.weight,
        reps: bestSet.reps,
        estOneRepMax: bestThisExercise,
      });
      bestSet.isPR = true;
      prCount += 1;
    }
  }
  return prCount;
}

async function testComplete() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const session = await WorkoutSession.findOne({ status: 'in-progress' }).populate('user');
    if (!session) {
      console.log('No in-progress session found');
      return;
    }
    
    console.log(`Found session ${session._id} for user ${session.user.email}`);
    const user = session.user;
    
    // Simulate what the API route does
    // Normally it does: `if (Array.isArray(body.exercises)) session.exercises = body.exercises`
    // Wait, let's fetch an existing session to see if we get an error on save.
    const now = new Date();
    session.completedAt = now;
    session.durationSeconds = Math.max(0, Math.round((now - session.startedAt) / 1000));
    session.totalVolume = computeVolume(session.exercises);
    session.prCount = await detectAndRecordPRs({
      userId: user._id,
      sessionId: session._id,
      exercises: session.exercises,
    });
    session.status = 'completed';
    user.xp = (user.xp || 0) + 100;
    
    console.log('Validating session...');
    const err = session.validateSync();
    if (err) {
      console.error('Validation error on session:', err);
    }
    
    console.log('Saving session...');
    // await session.save(); // Don't actually save so we don't ruin user's state
    
    console.log('Test complete. No errors.');
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await mongoose.disconnect();
  }
}

testComplete();
