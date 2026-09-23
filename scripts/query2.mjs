import mongoose from 'mongoose';
import WorkoutSession from '../models/WorkoutSession.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';

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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvLocal();

async function query() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({ xp: 120 });
  for (const u of users) {
    console.log("User:", u.email, "XP:", u.xp, "Badges:", JSON.stringify(u.badges));
    const sessions = await WorkoutSession.find({ user: u._id });
    console.log(`Sessions for ${u.email}:`, sessions.map(s => ({ status: s.status, createdAt: s.createdAt, duration: s.durationSeconds })));
  }
  
  if (users.length === 0) {
     const allUsers = await User.find();
     for(const u of allUsers) {
         console.log("User:", u.email, "XP:", u.xp, "Badges:", JSON.stringify(u.badges));
         const sessions = await WorkoutSession.find({ user: u._id });
         console.log(`Sessions for ${u.email}:`, sessions.map(s => ({ status: s.status, createdAt: s.createdAt, duration: s.durationSeconds })));
     }
  }
  await mongoose.disconnect();
}
query();
