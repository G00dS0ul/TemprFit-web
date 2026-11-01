import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import MealPlan from '@/models/MealPlan';
import {
  mealPlanCompleteRequestSchema,
  mealPlanCompleteResponseSchema,
} from '@/lib/contracts/v1/nutrition';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const parsed = mealPlanCompleteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { dayNumber, mealName, completed } = parsed.data;

    const plan = await MealPlan.findOne({ user: user._id, active: true });
    if (!plan) {
      return NextResponse.json({ error: 'No active meal plan found.' }, { status: 404 });
    }

    if (completed) {
      await MealPlan.updateOne(
        { _id: plan._id },
        {
          $addToSet: {
            completedMeals: {
              dayNumber,
              mealName,
              timestamp: new Date(),
            },
          },
        }
      );
    } else {
      await MealPlan.updateOne(
        { _id: plan._id },
        {
          $pull: {
            completedMeals: {
              dayNumber,
              mealName,
            },
          },
        }
      );
    }

    const responseData = mealPlanCompleteResponseSchema.parse({ success: true });
    return NextResponse.json(responseData);
  } catch (err) {
    console.error('[v1/nutrition/plan/complete] POST Error:', err);
    return NextResponse.json({ error: 'Failed to update meal completion status.' }, { status: 500 });
  }
}
