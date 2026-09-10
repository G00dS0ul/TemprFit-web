import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';
import Exercise from '@/models/Exercise'; // Needed to populate

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await User.findById(sessionUser._id).populate('favoriteExercises').lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ favorites: user.favoriteExercises || [] });
}

export async function POST(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { exerciseId, action } = await req.json();
  if (!exerciseId || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const user = await User.findById(sessionUser._id);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (action === 'add') {
    if (!user.favoriteExercises.includes(exerciseId)) {
      user.favoriteExercises.push(exerciseId);
    }
  } else {
    user.favoriteExercises = user.favoriteExercises.filter(id => id.toString() !== exerciseId);
  }

  await user.save();
  return NextResponse.json({ success: true, favoriteExercises: user.favoriteExercises });
}
