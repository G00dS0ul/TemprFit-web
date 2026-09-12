import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Moment from '@/models/Moment';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  await connectDB();
  
  try {
    const moments = await Moment.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'username avatarUrl')
      .populate('comments.user', 'username avatarUrl')
      .populate('comments.replies.user', 'username avatarUrl')
      .lean();
    return NextResponse.json({ moments });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch moments' }, { status: 500 });
  }
}

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  try {
    const { mediaUrl, caption } = await req.json();
    if (!mediaUrl) return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });

    const newMoment = await Moment.create({
      user: user._id,
      mediaUrl,
      caption: caption || '',
    });

    // Populate user before returning
    await newMoment.populate('user', 'username avatarUrl');
    
    return NextResponse.json({ success: true, moment: newMoment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create moment' }, { status: 500 });
  }
}
