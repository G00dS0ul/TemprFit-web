import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import Exercise from '../models/Exercise.js';

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
  const ex = await Exercise.findOne({ slug: 'push-up' });
  console.log("EXACT PUSH-UP:");
  console.log(JSON.stringify(ex, null, 2));
  
  const exs = await Exercise.find({ name: /push/i });
  console.log("\nALL PUSH EXERCISES:");
  exs.forEach(e => console.log(e.name, '->', e.slug, 'media:', JSON.stringify(e.media)));
  
  await mongoose.disconnect();
}
query();
