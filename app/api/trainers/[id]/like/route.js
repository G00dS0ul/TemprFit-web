import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req, { params }) {
  try {
    const authResult = await verifyAuth(req);
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: trainerId } = params;
    const userId = authResult.user.id;

    await connectMongo();

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
