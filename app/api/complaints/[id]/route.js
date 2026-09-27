import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Complaint from '@/models/Complaint';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req, { params }) {
  await connectDB();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = params;
    const { userFeedback } = await req.json();

    const complaint = await Complaint.findOne({ _id: id, user: sessionUser._id });
    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });

    complaint.userFeedback = userFeedback;
    await complaint.save();

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}