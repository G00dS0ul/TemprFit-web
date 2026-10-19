import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { onboardingRequestSchema, onboardingResponseSchema } from '@/lib/contracts/v1/user';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload.' }, { status: 400 });
    }

    const validation = onboardingRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid onboarding parameters.', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { fitnessProfile, hasCompletedOnboarding, onboardingTourSeen } = validation.data;

    // Apply updates
    if (fitnessProfile) {
      user.fitnessProfile = {
        ...(user.fitnessProfile ? user.fitnessProfile.toObject?.() || user.fitnessProfile : {}),
        ...fitnessProfile,
        workoutContext: {
          ...(user.fitnessProfile?.workoutContext || {}),
          ...(fitnessProfile.workoutContext || {}),
        },
        bodyMetrics: {
          ...(user.fitnessProfile?.bodyMetrics || {}),
          ...(fitnessProfile.bodyMetrics || {}),
        },
      };
    }

    user.hasCompletedOnboarding = hasCompletedOnboarding;

    if (onboardingTourSeen) {
      user.onboardingTourSeen = onboardingTourSeen;
    }

    await user.save();

    const responsePayload = onboardingResponseSchema.parse({
      success: true,
      user: user.toSafeObject(),
    });

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error('[v1/user/onboarding] POST Error:', err);
    return NextResponse.json({ error: 'Failed to complete onboarding.' }, { status: 500 });
  }
}
