import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Complaint from '@/models/Complaint';

export async function POST(req) {
  await connectDB();
  
  try {
    const { email, message } = await req.json();
    
    if (!email || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 });
    }

    const complaint = await Complaint.create({
      email,
      subject: 'Account Ban Appeal',
      message,
      type: 'appeal'
    });

    return NextResponse.json({ success: true, complaint }, { status: 201 });
  } catch (error) {
    console.error('Appeal creation error:', error);
    return NextResponse.json({ error: 'Failed to submit appeal' }, { status: 500 });
  }
}
