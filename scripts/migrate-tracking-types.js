import mongoose from 'mongoose';
import Exercise from '../models/Exercise.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env.local
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
let mongoUri = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('MONGODB_URI=')) {
    mongoUri = line.replace('MONGODB_URI=', '').trim();
    if (mongoUri.startsWith('"') && mongoUri.endsWith('"')) {
      mongoUri = mongoUri.slice(1, -1);
    }
  }
});

async function migrateTrackingTypes() {
  if (!mongoUri) {
    console.error('Missing MONGODB_URI in .env.local');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const exercises = await Exercise.find({});
    console.log(`Found ${exercises.length} exercises to check.`);

    let updated = 0;

    for (const ex of exercises) {
      const name = ex.name.toLowerCase();
      let type = 'weight_reps';

      const isBodyweight = ex.equipment.some(e => e.toLowerCase() === 'bodyweight' || e.toLowerCase() === 'none');
      const isTimeBased = name.includes('plank') || name.includes('wall sit') || name.includes('hold') || name.includes('stretch') || name.includes('run') || name.includes('jog') || name.includes('sprint');

      if (isTimeBased) {
        type = 'time_only';
      } else if (isBodyweight) {
        type = 'reps_only';
      }

      if (ex.trackingType !== type) {
        ex.trackingType = type;
        await ex.save();
        updated++;
        console.log(`Updated [${ex.name}] -> ${type}`);
      }
    }

    console.log(`Migration complete. Updated ${updated} exercises.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateTrackingTypes();
