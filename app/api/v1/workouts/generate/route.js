import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Exercise from '@/models/Exercise';
import { prescribe } from '@/lib/prescription';
import { askGemini, GeminiConfigError, GeminiRequestError } from '@/lib/gemini';
import { buildUserContext } from '@/lib/coach-context';
import { checkAndIncrementAILimit } from '@/lib/aiLimit';
import {
  EQUIPMENT_IMAGE_LIMITS,
  validateAndNormalizeEquipmentImages,
  workoutGenerateRequestSchema,
  workoutGenerateResponseSchema,
} from '@/lib/contracts/v1/workouts';

export const dynamic = 'force-dynamic';

const MINUTES_PER_EXERCISE = 8;

async function readBoundedRequestBody(request) {
  const contentLength = Number(request.headers?.get('content-length'));
  if (contentLength && contentLength > EQUIPMENT_IMAGE_LIMITS.maxBodyBytes) {
    const error = new Error('Generation request is too large.');
    error.status = 413;
    throw error;
  }

  if (request.body && typeof request.body.getReader === 'function') {
    const reader = request.body.getReader();
    const chunks = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
      if (totalBytes > EQUIPMENT_IMAGE_LIMITS.maxBodyBytes) {
        try {
          await reader.cancel();
        } catch {
          // ignore stream cancel error
        }
        const error = new Error('Generation request is too large.');
        error.status = 413;
        throw error;
      }
      chunks.push(value);
    }

    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder().decode(combined);
  }

  if (typeof request.text === 'function') {
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > EQUIPMENT_IMAGE_LIMITS.maxBodyBytes) {
      const error = new Error('Generation request is too large.');
      error.status = 413;
      throw error;
    }
    return text;
  }

  return '';
}

function rulesBasedSelection(candidates, targetCount) {
  const byMuscle = new Map();
  for (const ex of candidates) {
    const m = ex.targetMuscles.primary;
    if (!byMuscle.has(m)) byMuscle.set(m, []);
    byMuscle.get(m).push(ex);
  }
  const muscleGroups = [...byMuscle.keys()];
  for (const list of byMuscle.values()) list.sort(() => Math.random() - 0.5);

  const selected = [];
  let round = 0;
  while (selected.length < targetCount && selected.length < candidates.length) {
    const muscle = muscleGroups[round % muscleGroups.length];
    const pool = byMuscle.get(muscle);
    const pick = pool?.shift();
    if (pick) selected.push(pick);
    round += 1;
    if (round > candidates.length * 2) break;
  }
  return selected;
}

function parseJsonLoose(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

async function aiAssistedSelection({
  candidates,
  targetCount,
  goal,
  user,
  notes,
  customEquipment,
  normalizedImages,
}) {
  const candidateList = candidates
    .map((ex) => `${ex.slug} | ${ex.name} | primary: ${ex.targetMuscles.primary} | equipment: ${ex.equipment} | difficulty: ${ex.difficulty}`)
    .join('\n');

  let imagesNote = '';
  if (Array.isArray(normalizedImages) && normalizedImages.length > 0) {
    imagesNote = `\nThe user provided ${normalizedImages.length} photo(s) of their available equipment and gym space attached to this request. Analyze the attached images to identify available equipment, machines, weights, and accessories, and prioritize selecting matching exercises from the candidate list.`;
  }

  const systemPrompt = `You are a certified strength and conditioning coach. Pick EXACTLY ${targetCount} exercises from the CANDIDATE LIST below to build a balanced, effective workout for the user's goal: "${goal}".

RULES:
1. You may ONLY choose exercises that appear in the CANDIDATE LIST below, cited by their EXACT slug.
2. Return a JSON object with this shape:
   {
     "reasoning": "2-3 sentences explaining the structure of this session",
     "slugs": ["slug-1", "slug-2", ...]
   }
3. The "slugs" array must contain exactly ${targetCount} unique slugs from the list.
4. Order them logically (e.g. compound before isolation).

USER PROFILE & CONTEXT:
${await buildUserContext(user)}
${notes ? `User notes: "${notes}"` : ''}
${customEquipment ? `Custom equipment notes: "${customEquipment.join(', ')}"` : ''}
${imagesNote}

CANDIDATE LIST:
${candidateList}`;

  const responseText = await askGemini({
    systemPrompt,
    history: [],
    userMessage: `Build my ${targetCount}-exercise ${goal} workout from the candidate list now.`,
    attachments: normalizedImages && normalizedImages.length > 0 ? normalizedImages : undefined,
    responseMimeType: 'application/json',
  });

  const parsed = parseJsonLoose(responseText);
  if (!parsed || !Array.isArray(parsed.slugs)) return null;

  const candidateBySlug = new Map(candidates.map((c) => [c.slug, c]));
  const selected = [];
  for (const slug of parsed.slugs) {
    const match = candidateBySlug.get(slug);
    if (match && !selected.includes(match)) selected.push(match);
  }

  if (selected.length < Math.min(targetCount, candidates.length)) return null;
  return { selected, reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : null };
}

export async function POST(request) {
  try {
    let rawBody;
    try {
      rawBody = await readBoundedRequestBody(request);
    } catch (err) {
      if (err.status === 413) {
        return NextResponse.json(
          { error: 'Generation request is too large.' },
          { status: 413 }
        );
      }
      throw err;
    }

    let body;
    try {
      body = rawBody.trim() === '' ? {} : JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid generation parameters.' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const parsed = workoutGenerateRequestSchema.safeParse(body);
    if (!parsed.success) {
      const formatted = parsed.error.format();
      if (formatted.equipmentImages) {
        return NextResponse.json(
          { error: 'Invalid equipment images.', details: formatted.equipmentImages },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid generation parameters.', details: formatted },
        { status: 400 }
      );
    }

    const { timeMinutes, equipment, muscles, goal, useAI, notes, customEquipment, equipmentImages } = parsed.data;

    let normalizedImages = [];
    if (equipmentImages !== undefined) {
      const imageValidation = validateAndNormalizeEquipmentImages(equipmentImages);
      if (!imageValidation.valid) {
        return NextResponse.json(
          { error: 'Invalid equipment images.', details: imageValidation.error },
          { status: 400 }
        );
      }
      normalizedImages = imageValidation.normalized;
    }

    const targetCount = Math.max(3, Math.min(10, Math.round(timeMinutes / MINUTES_PER_EXERCISE)));

    const filter = { publicationStatus: 'published' };
    if (Array.isArray(equipment) && equipment.length > 0) {
      filter.equipment = { $in: equipment };
    }
    if (Array.isArray(muscles) && muscles.length > 0) {
      filter['targetMuscles.primary'] = { $in: muscles };
    }

    const candidates = await Exercise.find(filter)
      .select('name slug targetMuscles equipment difficulty alternatives category')
      .lean();

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'No exercises matched those filters. Try selecting more equipment or muscle groups.' },
        { status: 400 }
      );
    }

    let selected = null;
    let generatedBy = 'rules';
    let aiReasoning = null;
    let aiFallbackReason = null;

    if (useAI) {
      const limitCheck = await checkAndIncrementAILimit(user._id);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: limitCheck.error, upgrade: true },
          { status: 429 }
        );
      }

      try {
        const aiResult = await aiAssistedSelection({
          candidates,
          targetCount,
          goal,
          user,
          notes,
          customEquipment,
          normalizedImages,
        });

        if (aiResult) {
          selected = aiResult.selected;
          aiReasoning = aiResult.reasoning;
          generatedBy = 'ai';

          user.aiUsage = user.aiUsage || {};
          user.aiUsage.count = (user.aiUsage.count || 0) + 1;
          user.xp = (user.xp || 0) + 20;

          if (user.aiUsage.count >= 3) {
            const hasBadge = user.badges?.some((b) => b.badgeId === 'ai_pioneer');
            if (!hasBadge) {
              user.badges = user.badges || [];
              user.badges.push({ badgeId: 'ai_pioneer' });
              user.xp += 50;
            }
          }
          await user.save();
        } else {
          aiFallbackReason = "The AI's response could not be validated against the real exercise list, so a rules-based workout was generated instead.";
        }
      } catch (err) {
        aiFallbackReason =
          err instanceof GeminiConfigError
            ? 'AI generation needs GEMINI_API_KEY set — used the rules-based generator instead.'
            : `AI generation failed (${err.message}) — used the rules-based generator instead.`;
      }
    }

    if (!selected) {
      selected = rulesBasedSelection(candidates, targetCount);
    }

    const exercises = selected.map((ex) => {
      const plan = prescribe(ex, { goal });
      const setCount = plan.sets;
      const sets = Array.from({ length: setCount }, () => ({
        targetReps: plan.reps || '',
        targetWeight: 0,
        restSeconds: plan.restSeconds,
        tempo: '',
      }));
      return {
        exercise: ex._id,
        name: ex.name,
        slug: ex.slug,
        sets,
        targetMuscles: ex.targetMuscles,
        alternatives: ex.alternatives || [],
      };
    });

    const payload = {
      name: `${timeMinutes}-Minute ${goal.replace('-', ' ')} Workout`,
      goal,
      generatorInputs: { timeMinutes, equipment, muscles, goal, useAI, notes },
      generatedBy,
      aiReasoning,
      aiFallbackReason,
      exercises,
    };

    const validated = workoutGenerateResponseSchema.parse(payload);
    return NextResponse.json(validated);
  } catch (err) {
    console.error('[v1/workouts/generate] POST Error:', err);
    return NextResponse.json({ error: 'Failed to generate workout.' }, { status: 500 });
  }
}
