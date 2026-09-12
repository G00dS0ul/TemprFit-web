import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Exercise from '../models/Exercise.js';

// We must explicitly use the native fetch if this is run as a standalone node script in Node 18+
const {
  MONGODB_URI,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  RAPIDAPI_KEY,
  RAPIDAPI_HOST,
} = process.env;

if (!MONGODB_URI || !CLOUDINARY_CLOUD_NAME || !RAPIDAPI_KEY) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const mapMuscle = (m) => {
  if (!m) return 'full body';
  m = m.toLowerCase();
  if (m.includes('abs') || m.includes('core')) return 'abdominals';
  if (m.includes('lat') || m.includes('back')) return 'back';
  if (m.includes('chest') || m.includes('pec')) return 'chest';
  if (m.includes('shoulder') || m.includes('delt')) return 'shoulders';
  if (m.includes('bicep')) return 'biceps';
  if (m.includes('tricep')) return 'triceps';
  if (m.includes('quad')) return 'quads';
  if (m.includes('ham')) return 'hamstrings';
  if (m.includes('glute')) return 'glutes';
  if (m.includes('calf') || m.includes('calves')) return 'calves';
  if (m.includes('forearm')) return 'forearms';
  return 'full body';
};

const mapCategory = (c) => {
  if (!c) return 'bodybuilding';
  c = c.toLowerCase();
  if (c.includes('cardio')) return 'cardio';
  if (c.includes('stretch')) return 'stretching';
  if (c.includes('plyo')) return 'plyometrics';
  if (c.includes('power')) return 'powerlifting';
  if (c.includes('olympic')) return 'olympic weightlifting';
  if (c.includes('strongman')) return 'strongman';
  return 'bodybuilding';
};

async function runSync() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  let offset = 0;
  const limit = 100;
  let hasMore = true;
  let totalProcessed = 0;

  while (hasMore) {
    console.log(`Fetching from ExerciseDB offset ${offset}...`);
    const url = `https://${RAPIDAPI_HOST}/exercises?limit=${limit}&offset=${offset}`;
    
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch from RapidAPI: ${response.status} ${response.statusText}`);
      break;
    }

    const exercises = await response.json();
    if (exercises.length === 0) {
      hasMore = false;
      break;
    }

    for (const ex of exercises) {
      const slug = ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Check if we already have it with a cloudinary URL
      const existingEx = await Exercise.findOne({ slug });
      const currentMediaUrl = existingEx && Array.isArray(existingEx.media) 
        ? existingEx.media[0]?.url 
        : existingEx?.media?.url;

      if (currentMediaUrl && currentMediaUrl.includes('res.cloudinary.com')) {
        console.log(`Skipping ${slug} - already has Cloudinary URL`);
        continue;
      }

      try {
        console.log(`Uploading GIF for ${slug}...`);
        const imgUrl = `https://${RAPIDAPI_HOST}/image?exerciseId=${ex.id}&resolution=360`;
        const imgRes = await fetch(imgUrl, {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          }
        });
        
        if (!imgRes.ok) {
           console.log(`Could not fetch image for ${slug}: ${imgRes.status}`);
           continue; // If we can't get the image, we skip upserting to avoid blank records
        }
        
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64Str = Buffer.from(arrayBuffer).toString('base64');
        const dataUri = `data:image/gif;base64,${base64Str}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'exercises/gifs',
          resource_type: 'image',
        });

        const optimizedUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
        
        // Preserve legacy array fallback if updating an existing record
        const fallback = existingEx && Array.isArray(existingEx.media) && existingEx.media.length > 0 
          ? (existingEx.media[0]?.url || '') 
          : (existingEx?.media?.fallbackUrl || '');

        const primaryMuscle = ex.target ? mapMuscle(ex.target) : 'full body';
        const secondaryMuscles = (ex.secondaryMuscles || []).map(mapMuscle);

        const updateDoc = {
          name: ex.name,
          slug: slug,
          description: ex.description || '',
          instructions: ex.instructions || [],
          targetMuscles: {
            primary: primaryMuscle,
            secondary: secondaryMuscles.filter(m => m !== primaryMuscle)
          },
          equipment: ex.equipment ? [ex.equipment] : [],
          category: mapCategory(ex.category),
          media: {
            type: 'gif',
            url: optimizedUrl,
            fallbackUrl: fallback
          },
          source: {
            name: 'ExerciseDB',
            url: '',
            license: 'original'
          }
        };

        // Use findOneAndUpdate with upsert
        await Exercise.findOneAndUpdate(
          { slug },
          { $set: updateDoc },
          { upsert: true, new: true, runValidators: true }
        );
        
        console.log(`Upserted ${slug} with URL: ${optimizedUrl}`);
        totalProcessed++;

      } catch (err) {
        console.error(`Error processing ${slug}:`, err.message);
      }
    }

    offset += limit;
  }

  console.log(`Sync complete! Processed ${totalProcessed} exercises.`);
  process.exit(0);
}

runSync().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
