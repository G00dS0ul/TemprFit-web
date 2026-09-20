import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';

export async function GET(req, { params }) {
  try {
    await connectDB();
    
    // Case-insensitive regex match for username
    const username = params.username;
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
      .select('username avatarUrl activeColor activeBorder xp checkInStreak currentStreak plan badges');
      
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Aggregate total volume from completed workouts
    const volumeAgg = await WorkoutSession.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      { $group: { _id: null, totalVolume: { $sum: '$totalVolume' }, sessions: { $sum: 1 } } }
    ]);
    
    const stats = volumeAgg[0] || { totalVolume: 0, sessions: 0 };

    return NextResponse.json({ 
      user,
      stats
    });
  } catch (error) {
    console.error('User profile fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
