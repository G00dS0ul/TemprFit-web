import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Complaint from '@/models/Complaint';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subject, message } = await req.json();
    
    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const complaint = await Complaint.create({
      user: sessionUser._id,
      email: sessionUser.email,
      subject,
      message,
      type: 'support'
    });

    return NextResponse.json({ success: true, complaint }, { status: 201 });
  } catch (error) {
    console.error('Complaint creation error:', error);
    return NextResponse.json({ error: 'Failed to submit complaint' }, { status: 500 });
  }
}

export async function GET(req) {
  await connectDB();
  const sessionUser = await getSessionUser();
  
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const complaints = await Complaint.find({ user: sessionUser._id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error('Complaint fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}
