import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: trainerId } = params;
    const userId = user._id;

    const trainer = await User.findById(trainerId);
    if (!trainer || (trainer.role !== 'trainer' && trainer.originalRole !== 'trainer')) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    const likes = trainer.trainerInfo?.likes || [];
    const isLiked = likes.includes(userId);

    if (isLiked) {
      // Remove like
      trainer.trainerInfo.likes = likes.filter(id => id.toString() !== userId);
    } else {
      // Add like
      trainer.trainerInfo.likes.push(userId);
    }

    await trainer.save();

    return NextResponse.json({ 
      success: true, 
      isLiked: !isLiked, 
      likesCount: trainer.trainerInfo.likes.length 
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
