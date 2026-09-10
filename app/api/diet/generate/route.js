import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { askGemini } from '@/lib/gemini';
import NutritionProfile from '@/models/NutritionProfile';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  // AI Diet Plan requires Pro plan
  const { checkPlanAccess } = await import('@/lib/plans');
  const { allowed } = checkPlanAccess(user, 'pro');
  if (!allowed) {
    return NextResponse.json(
      { error: 'AI Diet Plans require the PRO plan. Upgrade to unlock personalized meal planning.', upgrade: true, requiredPlan: 'pro' },
      { status: 403 }
    );
  }


  const { notes } = await req.json();

  const profile = await NutritionProfile.findOne({ user: user._id }).lean();
  let context = 'User has no nutrition profile yet. Generate a general healthy diet plan.';
  if (profile) {
    context = `User profile: Goal: ${profile.goal}, Pattern: ${profile.dietaryPattern}, Calories: ${profile.calorieTarget}kcal, Protein: ${profile.proteinTarget}g, Carbs: ${profile.carbsTarget}g, Fat: ${profile.fatTarget}g, Meals/day: ${profile.mealsPerDay}.`;
  }

  if (notes) {
    context += `\nAdditional Notes: ${notes}`;
  }

  const systemPrompt = `You are an expert AI Dietitian for TemprFit.
Based on the user's profile and notes, generate a structured diet plan.
You must respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "days": [
    {
      "dayNumber": 1,
      "meals": [
        { "mealType": "breakfast", "name": "...", "description": "...", "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }
      ]
    }
  ],
  "shoppingList": ["..."]
}
CRITICAL: Do NOT include introductory greetings like "Welcome to TemprFit". Provide the plan directly.`;

  try {
    const reply = await askGemini({
      systemPrompt,
      history: [],
      userMessage: `Generate my diet plan now.\n\nContext:\n${context}`,
    });

    const cleaned = reply.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({ plan: parsed });
  } catch (err) {
    return NextResponse.json({ error: 'The AI planner ran into an error or returned invalid format.' }, { status: 500 });
  }
}
