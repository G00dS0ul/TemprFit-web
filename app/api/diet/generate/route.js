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

  const { notes } = await req.json();

  const profile = await NutritionProfile.findOne({ user: user._id }).lean();
  let context = 'User has no nutrition profile yet. Generate a general healthy diet plan.';
  if (profile) {
    context = `User profile: Goal: ${profile.goal}, Pattern: ${profile.dietaryPattern}, Calories: ${profile.calorieTarget}kcal, Protein: ${profile.proteinTarget}g, Carbs: ${profile.carbsTarget}g, Fat: ${profile.fatTarget}g, Meals/day: ${profile.mealsPerDay}.`;
  }

  if (notes) {
    context += `\nAdditional Notes: ${notes}`;
  }

  const systemPrompt = `You are an expert AI Dietitian for REPForge.
Based on the user's profile and notes, generate a structured diet plan.
Format your response using Markdown tables so it's easy to read. Do NOT use random brackets or unstructured text.
Provide a clear weekly or daily breakdown with macros for each meal.
CRITICAL: Do NOT include introductory greetings like "Welcome to REPForge" or "Since you are just getting started". Provide the plan directly without assuming the user is new.`;

  try {
    const reply = await askGemini({
      systemPrompt,
      history: [],
      userMessage: `Generate my diet plan now.\n\nContext:\n${context}`,
    });

    return NextResponse.json({ plan: reply });
  } catch (err) {
    return NextResponse.json({ error: 'The AI planner ran into an error.' }, { status: 500 });
  }
}
