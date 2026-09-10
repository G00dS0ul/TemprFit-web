import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Moment from '@/models/Moment';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Moment ID required' }, { status: 400 });

  try {
    const { caption } = await req.json();
    const moment = await Moment.findById(id);

    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });
    if (moment.user.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to edit this moment' }, { status: 403 });
    }

    moment.caption = caption || '';
    await moment.save();

    return NextResponse.json({ success: true, moment });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Moment ID required' }, { status: 400 });

  try {
    const moment = await Moment.findById(id);
    
    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });
    if (moment.user.toString() !== user._id.toString() && user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized to delete this moment' }, { status: 403 });
    }

    await Moment.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
