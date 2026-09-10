import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  await connectDB();
  
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Trainer ID is required' }, { status: 400 });

  try {
    // Increment views atomically
    const trainer = await User.findByIdAndUpdate(
      id,
      { $inc: { 'trainerInfo.views': 1 } },
      { new: true }
    ).select('username email avatarUrl trainerInfo followers').lean();

    if (!trainer || !trainer.trainerInfo) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    const user = await getSessionUser();
    let isFollowing = false;
    if (user && trainer.followers && trainer.followers.some(f => f.toString() === user._id.toString())) {
      isFollowing = true;
    }

    return NextResponse.json({ trainer, isFollowing });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }
}
