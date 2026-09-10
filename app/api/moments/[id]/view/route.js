import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Moment from '@/models/Moment';

export async function POST(req, { params }) {
  await connectDB();
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Moment ID required' }, { status: 400 });

  try {
    const moment = await Moment.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });
    return NextResponse.json({ success: true, views: moment.views });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
