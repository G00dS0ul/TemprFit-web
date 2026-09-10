import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MealPlan from '@/models/MealPlan';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { dayNumber, mealName, completed } = await req.json();

    const plan = await MealPlan.findOne({ user: user._id, active: true });
    if (!plan) return NextResponse.json({ error: 'No active meal plan found' }, { status: 404 });

    if (completed) {
      await MealPlan.updateOne(
        { _id: plan._id },
        { $addToSet: { completedMeals: { dayNumber, mealName } } }
      );
    } else {
      await MealPlan.updateOne(
        { _id: plan._id },
        { $pull: { completedMeals: { dayNumber, mealName } } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
