import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import WorkoutPlan from '@/models/WorkoutPlan';
import { askGemini } from '@/lib/gemini';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    console.log('--- AI WORKOUT PAYLOAD ---', body);
    
    // Use fallbacks if parameters are somehow missing
    const goal = body.goal || 'General Fitness';
    const experience = body.experience || 'Beginner';
    const equipment = Array.isArray(body.equipment) ? body.equipment.join(', ') : (body.equipment || 'Full Gym');
    const daysPerWeek = body.daysPerWeek || 4;

    const systemPrompt = `
      You are an expert personal trainer. 
      Create a ${daysPerWeek}-day workout plan for a user with the following profile:
      - Goal: ${goal}
      - Experience Level: ${experience}
      - Available Equipment: ${equipment}
      
      Respond ONLY with a raw JSON object (no markdown formatting, no backticks).
      Format exactly like this:
      {
        "days": [
          {
            "dayNumber": 1,
            "focus": "Upper Body Push",
            "exercises": [
              {
                "name": "Barbell Bench Press",
                "sets": 3,
                "reps": "8-12",
                "rest": "90s",
                "notes": "Keep shoulders retracted"
              }
            ]
          }
        ]
      }
    `;

    const responseText = await askGemini({
      systemPrompt,
      userMessage: `Generate my workout plan now for ${daysPerWeek} days.`,
    });
    
    const cleanText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const planData = JSON.parse(cleanText);

    const workoutPlan = await WorkoutPlan.create({
      user: user._id,
      goal,
      experience,
      equipment,
      days: planData.days
    });

    return NextResponse.json({ success: true, plan: workoutPlan });
  } catch (error) {
    console.error('AI Workout Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate workout plan' }, { status: 500 });
  }
}

export async function GET(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const plans = await WorkoutPlan.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workout plans' }, { status: 500 });
  }
}
