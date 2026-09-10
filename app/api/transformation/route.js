import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Transformation from '@/models/Transformation';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const transformations = await Transformation.find({ user: sessionUser._id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ transformations });
}

export async function POST(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const transformation = await Transformation.create({
    user: sessionUser._id,
    baseImage: data.baseImage,
    newImage: data.newImage,
    gender: data.gender,
    baseTags: data.baseTags || [],
    newTags: data.newTags || [],
    aiFeedback: data.aiFeedback || '',
  });

  return NextResponse.json({ success: true, transformation });
}
