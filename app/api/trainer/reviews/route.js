import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Review from '@/models/Review';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user || user.role !== 'trainer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await Review.find({ trainer: user._id })
      .populate('trainee', 'username avatarUrl')
      .populate('program', 'title')
      .sort({ createdAt: -1 })
      .lean();

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
      : 0;

    return NextResponse.json({ reviews, avgRating });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
