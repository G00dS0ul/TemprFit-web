import mongoose from 'mongoose';
import WorkoutSession from '../models/WorkoutSession.js';
import User from '../models/User.js';
import PersonalRecord from '../models/PersonalRecord.js';
import path from 'path';
import fs from 'fs';
import { estOneRepMax, computeVolume } from '../lib/workout-utils.js';

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

async function testComplete() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const session = await WorkoutSession.findOne({ status: 'in-progress' }).populate('user');
    if (!session) {
      console.log('No in-progress session found');
      return;
    }
    
    // MOCK what happens when frontend posts body:
    // we get a populated session from some endpoint (e.g. GET /api/sessions/:id)
    // and then the frontend posts it back!
    const sessionPopulated = await WorkoutSession.findById(session._id)
      .populate('exercises.exercise')
      .lean();
      
    // simulate frontend making completed=true on some sets
    sessionPopulated.exercises[0].sets[0].completed = true;
    sessionPopulated.exercises[0].sets[0].reps = 10;
    sessionPopulated.exercises[0].sets[0].weight = 50;

    const body = { exercises: sessionPopulated.exercises };

    // now back to the completion logic:
    const sessionDoc = await WorkoutSession.findById(session._id);
    
    if (Array.isArray(body.exercises)) sessionDoc.exercises = body.exercises;

    const err = sessionDoc.validateSync();
    if (err) {
      console.error('Validation error on sessionDoc:', err);
    } else {
      console.log('Validation passed!');
    }
    
    // Simulate what happens in save
    try {
      await sessionDoc.save(); // it will rollback or fail?
      console.log('Save successful');
    } catch (err2) {
      console.error('Save error:', err2.message);
    }

  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await mongoose.disconnect();
  }
}

testComplete();
