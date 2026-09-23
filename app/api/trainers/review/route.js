import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Review from '@/models/Review';

export async function POST(req) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trainerId, rating, comment } = await req.json();

    if (!trainerId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // 1. Create independent Review record
    const newReview = await Review.create({
      trainer: trainerId,
      trainee: user._id,
      rating,
      comment,
      status: 'published'
    });

    // 2. Add to trainer's embedded reviews array and update average rating
    const trainer = await User.findById(trainerId);
    if (!trainer) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    const reviewPayload = {
      user: user._id,
      rating,
      comment,
      createdAt: new Date()
    };

    if (!trainer.trainerInfo) {
      trainer.trainerInfo = { reviews: [] };
    }
    if (!trainer.trainerInfo.reviews) {
      trainer.trainerInfo.reviews = [];
    }

    trainer.trainerInfo.reviews.push(reviewPayload);

    // Recalculate rating
    const totalReviews = trainer.trainerInfo.reviews.length;
    const sumRatings = trainer.trainerInfo.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    trainer.trainerInfo.rating = sumRatings / totalReviews;

    await trainer.save();

    return NextResponse.json({ success: true, review: newReview });
  } catch (error) {
    console.error('[API_REVIEW_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
