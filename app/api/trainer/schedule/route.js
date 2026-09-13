import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import ScheduleEvent from '@/models/ScheduleEvent';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user || user.role !== 'trainer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    const filter = { trainer: user._id };
    if (startStr && endStr) {
      filter.startTime = { $gte: new Date(startStr), $lte: new Date(endStr) };
    }

    const events = await ScheduleEvent.find(filter)
      .populate('trainee', 'username avatarUrl')
      .sort({ startTime: 1 })
      .lean();

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user || user.role !== 'trainer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, startTime, endTime, traineeId, notes } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await ScheduleEvent.create({
      trainer: user._id,
      trainee: traineeId || null,
      title,
      type,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
