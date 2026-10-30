import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { askGemini } from '@/lib/gemini';
import Exercise from '@/models/Exercise';
import {
  exerciseSwapRequestSchema,
  exerciseSwapCandidateListSchema,
  exerciseSwapResponseSchema,
} from '@/lib/contracts/v1/exercises';

export const dynamic = 'force-dynamic';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function POST(request) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsedBody = exerciseSwapRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid exercise swap parameters', details: parsedBody.error.format() },
      { status: 400 }
    );
  }

  const { exerciseName } = parsedBody.data;
  const currentEquipment = (parsedBody.data.currentEquipment && parsedBody.data.currentEquipment.trim())
    ? parsedBody.data.currentEquipment.trim()
    : 'Bodyweight, Dumbbells, Bands';

  try {
    const systemPrompt = `
You are an expert personal trainer.
The user needs an alternative to the exercise "${exerciseName}".
They only have access to: ${currentEquipment}.
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
`.trim();

    const responseText = await askGemini({
      systemPrompt,
      userMessage: `Give me 3 alternatives to ${exerciseName}.`,
      responseMimeType: 'application/json',
    });

    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    let rawCandidates;
    try {
      rawCandidates = JSON.parse(cleanText);
    } catch {
      return NextResponse.json({ error: 'Failed to generate alternatives' }, { status: 500 });
    }

    const parsedCandidates = exerciseSwapCandidateListSchema.safeParse(rawCandidates);
    if (!parsedCandidates.success) {
      return NextResponse.json({ error: 'Failed to generate alternatives' }, { status: 500 });
    }

    const candidates = parsedCandidates.data;

    // Perform case-insensitive anchored exact regex lookup for publicationStatus: 'published' exercises in MongoDB
    const regexQueries = candidates.map((c) => new RegExp(`^${escapeRegex(c.name)}$`, 'i'));
    const dbExercises = candidates.length > 0
      ? await Exercise.find({
          publicationStatus: 'published',
          name: { $in: regexQueries },
        }).select('_id slug name').lean()
      : [];

    const alternatives = candidates.map((candidate) => {
      const match = dbExercises.find(
        (e) => e.name && e.name.toLowerCase() === candidate.name.toLowerCase()
      );
      const hasIdentity = Boolean(match && match._id && match.slug);
      return {
        name: candidate.name,
        reason: candidate.reason,
        _id: hasIdentity ? match._id.toString() : null,
        slug: hasIdentity ? match.slug : null,
      };
    });

    const validatedResponse = exerciseSwapResponseSchema.parse({
      success: true,
      alternatives,
    });

    return NextResponse.json(validatedResponse);
  } catch (err) {
    console.error('[v1/exercises/swap] POST Error:', err);
    return NextResponse.json({ error: 'Failed to generate alternatives' }, { status: 500 });
  }
}
