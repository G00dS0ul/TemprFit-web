import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export async function POST(request, { params }) {
  await connectDB();
  
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id: trainerId } = params;
  if (!trainerId) return NextResponse.json({ error: 'Trainer ID is required' }, { status: 400 });

  if (user._id.toString() === trainerId.toString()) {
    return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
  }

  try {
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    const isFollowing = trainer.followers && trainer.followers.some(f => f.toString() === user._id.toString());
    
    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(trainerId, { $pull: { followers: user._id } });
      await User.findByIdAndUpdate(user._id, { $pull: { following: trainerId } });
      return NextResponse.json({ success: true, isFollowing: false });
    } else {
      // Follow
      await User.findByIdAndUpdate(trainerId, { $addToSet: { followers: user._id } });
      await User.findByIdAndUpdate(user._id, { $addToSet: { following: trainerId } });
      return NextResponse.json({ success: true, isFollowing: true });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Server error while following' }, { status: 500 });
  }
}
