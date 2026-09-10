import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import SavedDietPlan from '@/models/SavedDietPlan';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { content, title } = await req.json();
  if (!content) return NextResponse.json({ error: 'Content is required.' }, { status: 400 });

  const plan = await SavedDietPlan.create({
    user: user._id,
    title: title || `Diet Plan - ${new Date().toLocaleDateString()}`,
    content,
  });

  return NextResponse.json({ plan }, { status: 201 });
}

export async function GET(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const plans = await SavedDietPlan.find({ user: user._id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ plans });
}
