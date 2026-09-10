import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Notification from '@/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const user = await getSessionUser();
  if (!user || user.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trainer-specific stats
  const escrowBalance = user.trainerInfo?.escrowBalance || 0;
  const isFeatured = user.trainerInfo?.isFeatured || false;
  const specialties = user.trainerInfo?.specialties || [];
  const bio = user.trainerInfo?.bio || '';

  // Count notifications
  const unreadNotifs = await Notification.countDocuments({ user: user._id, read: false });

  return NextResponse.json({
    stats: {
      escrowBalance,
      activeClients: 0, // Will be populated when booking system is built
      upcomingSessions: 0,
      profileViews: user.trainerInfo?.views || 0,
      totalEarnings: escrowBalance,
      monthlyEarnings: 0,
      rating: 0,
      reviewCount: 0,
      followersCount: user.followers?.length || 0,
      likesCount: user.trainerInfo?.likes?.length || 0,
    },
    profile: {
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio,
      specialties,
      isFeatured,
      isApproved: user.trainerInfo?.isApproved || false,
      plan: user.plan,
    },
    unreadNotifs,
  });
}
