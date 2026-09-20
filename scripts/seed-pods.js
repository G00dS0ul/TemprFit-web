import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the local .env.local
const envPath = join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const PodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const Pod = mongoose.models.Pod || mongoose.model('Pod', PodSchema);

const PRESET_PODS = [
  { name: 'The Morning Club', description: 'Early risers and 5 AM lifters.', icon: 'Sun' },
  { name: 'Iron Addicts', description: 'Heavy lifters and bodybuilders.', icon: 'Dumbbell' },
  { name: 'Cardio Kings & Queens', description: 'Runners, cyclists, and HIIT enthusiasts.', icon: 'Activity' },
  { name: 'Yoga & Flow', description: 'Flexibility, mobility, and mindfulness.', icon: 'Flame' },
  { name: 'Beginner\'s Bootcamp', description: 'A safe space for newcomers to fitness.', icon: 'Shield' },
  { name: 'Powerlifting Syndicate', description: 'Chasing the 1-rep max.', icon: 'Trophy' },
  { name: 'Calisthenics Crew', description: 'Bodyweight masters.', icon: 'Zap' },
  { name: 'Weekend Warriors', description: 'Those who crush it on Saturday and Sunday.', icon: 'Medal' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    for (const pod of PRESET_PODS) {
      const exists = await Pod.findOne({ name: pod.name });
      if (!exists) {
        await Pod.create(pod);
        console.log(`Created pod: ${pod.name}`);
      } else {
        console.log(`Pod already exists: ${pod.name}`);
      }
    }
    
    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
