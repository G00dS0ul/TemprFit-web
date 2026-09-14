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
    
    const body = await req.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid rating between 1 and 5 is required' }, { status: 400 });
    }
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Review comment is required' }, { status: 400 });
    }

    const trainer = await User.findById(trainerId);
    if (!trainer || (trainer.role !== 'trainer' && trainer.originalRole !== 'trainer')) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    // Check if user already reviewed
    const existingReviewIndex = trainer.trainerInfo.reviews.findIndex(r => r.user.toString() === userId);
    
    if (existingReviewIndex >= 0) {
      // Update existing review
      trainer.trainerInfo.reviews[existingReviewIndex].rating = rating;
      trainer.trainerInfo.reviews[existingReviewIndex].comment = comment;
      trainer.trainerInfo.reviews[existingReviewIndex].createdAt = new Date();
    } else {
      // Add new review
      trainer.trainerInfo.reviews.push({
        user: userId,
        rating,
        comment,
        createdAt: new Date()
      });
    }

    // Calculate new average rating
    const totalReviews = trainer.trainerInfo.reviews.length;
    const sumRatings = trainer.trainerInfo.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    trainer.trainerInfo.rating = totalReviews > 0 ? (sumRatings / totalReviews) : 0;

    await trainer.save();

    return NextResponse.json({ 
      success: true, 
      rating: trainer.trainerInfo.rating,
      reviewsCount: totalReviews
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
