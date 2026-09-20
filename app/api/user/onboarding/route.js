import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const data = await request.json();
    
    await connectDB();
    
    // We expect { fitnessProfile, hasCompletedOnboarding }
    const updatePayload = {};
    if (data.fitnessProfile) updatePayload.fitnessProfile = data.fitnessProfile;
    if (data.hasCompletedOnboarding !== undefined) updatePayload.hasCompletedOnboarding = data.hasCompletedOnboarding;
    if (data.onboardingTourSeen) {
      updatePayload.$set = {};
      for (const [key, val] of Object.entries(data.onboardingTourSeen)) {
        updatePayload.$set[`onboardingTourSeen.${key}`] = val;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.userId,
      updatePayload.onboardingTourSeen ? updatePayload : { $set: updatePayload },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser.toSafeObject() });
  } catch (error) {
    console.error('Onboarding API Error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
