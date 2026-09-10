import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(req) {
  await connectDB();
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 403 });
  }

  try {
    const { trainerId, isApproved } = await req.json();
    
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 });
    }

    if (isApproved) {
      if (!trainer.trainerInfo) trainer.trainerInfo = {};
      trainer.trainerInfo.isApproved = true;
      trainer.trainerInfo.isVerified = true;
      await trainer.save();

      await Notification.create({
        user: trainer._id,
        title: 'Application Approved!',
        message: 'Congratulations! Your trainer application has been approved and you are now a verified trainer.',
        type: 'system'
      });
    } else {
      // If rejected, you might change their role back to user or just leave them unapproved.
      // We will revert them to a normal user.
      trainer.role = 'user';
      await trainer.save();

      await Notification.create({
        user: trainer._id,
        title: 'Application Update',
        message: 'Your trainer application was not approved at this time.',
        type: 'system'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trainer status' }, { status: 500 });
  }
}
