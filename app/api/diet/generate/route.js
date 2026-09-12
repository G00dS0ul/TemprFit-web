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

  const { checkAndIncrementAILimit } = await import('@/lib/aiLimit');
  const limitCheck = await checkAndIncrementAILimit(user._id);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { error: limitCheck.error, upgrade: true },
      { status: 429 }
    );
  }


  const { notes } = await req.json();

  const profile = await NutritionProfile.findOne({ user: user._id }).lean();
  let context = 'User has no nutrition profile yet. Generate a general healthy diet plan.';
  if (profile) {
    context = `User profile: Goal: ${profile.goal}, Pattern: ${profile.dietaryPattern}, Calories: ${profile.calorieTarget}kcal, Protein: ${profile.proteinTarget}g, Carbs: ${profile.carbsTarget}g, Fat: ${profile.fatTarget}g, Meals/day: ${profile.mealsPerDay}.`;
    
    if (profile.age) context += `\nAge: ${profile.age}`;
    if (profile.location) context += `\nLocation (for seasonal/local food context): ${profile.location}`;
    if (profile.budget) context += `\nBudget: ${profile.budget}`;
    if (profile.pantry && profile.pantry.length > 0) context += `\nAvailable Ingredients / Pantry: ${profile.pantry.join(', ')}`;
    if (profile.allergies && profile.allergies.length > 0) context += `\nAllergies: ${profile.allergies.join(', ')}`;
    if (profile.exclusions && profile.exclusions.length > 0) context += `\nExclusions: ${profile.exclusions.join(', ')}`;
  }

  if (notes) {
    context += `\nAdditional Notes: ${notes}`;
  }

  const systemPrompt = `You are an expert AI Dietitian for TemprFit.
Based on the user's profile and notes, generate a structured diet plan.
Pay special attention to their location, age, budget, and especially their available pantry ingredients to tailor the recipes.
You must respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
  "days": [
    {
      "dayNumber": 1,
      "meals": [
        { "mealType": "breakfast", "name": "...", "description": "...", "calories": <NUMBER>, "protein": <NUMBER>, "carbs": <NUMBER>, "fat": <NUMBER> }
      ]
    }
  ],
  "shoppingList": ["..."]
}
CRITICAL: Do NOT include introductory greetings. Provide the plan directly. Ensure calories, protein, carbs, and fat are EXACT numbers (e.g., 400, not "400g" or "400-500").`;

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
