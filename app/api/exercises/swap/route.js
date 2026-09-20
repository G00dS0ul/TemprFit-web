import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { askGemini } from '@/lib/gemini';
import Exercise from '@/models/Exercise';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const { exerciseName, currentEquipment } = body;

    if (!exerciseName) {
      return NextResponse.json({ error: 'exerciseName is required' }, { status: 400 });
    }

    const systemPrompt = `
      You are an expert personal trainer.
      The user needs an alternative to the exercise "${exerciseName}".
      They only have access to: ${currentEquipment || 'Bodyweight, Dumbbells, Bands'}.
      Suggest exactly 3 alternative exercises that target similar muscle groups and movement patterns.
      
      Respond ONLY with a raw JSON array of objects (no markdown formatting, no backticks).
      Format exactly like this:
      [
        {
          "name": "Alternative Exercise 1",
          "reason": "Why this is a good alternative"
        },
        ...
      ]
    `;

    const responseText = await askGemini({
      systemPrompt,
      userMessage: `Give me 3 alternatives to ${exerciseName}.`,
    });
    
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const alternatives = JSON.parse(cleanText);

    // Try to match these alternatives to actual exercises in the database
    const dbExercises = await Exercise.find({
      name: { $in: alternatives.map(a => new RegExp(`^${a.name}$`, 'i')) }
    }).lean();

    // Map the DB data back, fallback to generic if not found in DB
    const finalAlternatives = alternatives.map(alt => {
      const dbEx = dbExercises.find(e => e.name.toLowerCase() === alt.name.toLowerCase());
      return {
        ...alt,
        slug: dbEx ? dbEx.slug : null,
        _id: dbEx ? dbEx._id : null
      };
    });

    return NextResponse.json({ success: true, alternatives: finalAlternatives });
  } catch (error) {
    console.error('Exercise Swap Error:', error);
    return NextResponse.json({ error: 'Failed to generate alternatives' }, { status: 500 });
  }
}
