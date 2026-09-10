import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const specialty = searchParams.get('specialty') || '';
  const minPrice = parseInt(searchParams.get('minPrice')) || 0;
  const maxPrice = parseInt(searchParams.get('maxPrice')) || 99999;
  const mode = searchParams.get('mode') || ''; // 'remote', 'physical', 'hybrid'

  // Build MongoDB query
  const query = { role: 'trainer' };

  if (q) {
    query.$or = [
      { username: { $regex: q, $options: 'i' } },
      { 'trainerInfo.location': { $regex: q, $options: 'i' } },
      { 'trainerInfo.bio': { $regex: q, $options: 'i' } },
    ];
  }

  if (specialty && specialty !== 'All') {
    query['trainerInfo.specialties'] = { $regex: specialty, $options: 'i' };
  }

  if (mode && mode !== 'All') {
    query['trainerInfo.trainingMode'] = mode;
  }

  query['trainerInfo.price'] = { $gte: minPrice, $lte: maxPrice };

  // Fetch trainers
  const trainers = await User.find(query)
    .select('username avatarUrl trainerInfo email')
    .lean();

  // Sort: Featured trainers first, then by whether their featured period is valid, then by name
  const now = new Date();
  trainers.sort((a, b) => {
    const aFeatured = a.trainerInfo?.isFeatured && (!a.trainerInfo?.featuredUntil || new Date(a.trainerInfo.featuredUntil) > now);
    const bFeatured = b.trainerInfo?.isFeatured && (!b.trainerInfo?.featuredUntil || new Date(b.trainerInfo.featuredUntil) > now);

    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return (a.username || '').localeCompare(b.username || '');
  });

  return NextResponse.json({ trainers });
}
