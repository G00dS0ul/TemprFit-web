import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Moment from '@/models/Moment';
import { getSessionUser } from '@/lib/auth';

export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Moment ID required' }, { status: 400 });

  try {
    const moment = await Moment.findById(id);
    if (!moment) return NextResponse.json({ error: 'Moment not found' }, { status: 404 });

    const isSaved = moment.savedBy && moment.savedBy.some(s => s.toString() === user._id.toString());
    
    if (isSaved) {
      await Moment.findByIdAndUpdate(id, { $pull: { savedBy: user._id } });
      return NextResponse.json({ success: true, isSaved: false });
    } else {
      await Moment.findByIdAndUpdate(id, { $addToSet: { savedBy: user._id } });
      return NextResponse.json({ success: true, isSaved: true });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
