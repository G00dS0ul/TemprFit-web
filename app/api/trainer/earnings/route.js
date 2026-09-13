import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Booking from '@/models/Booking';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user || user.role !== 'trainer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await Booking.find({ trainer: user._id })
      .populate('trainee', 'username email')
      .populate('program', 'title')
      .sort({ createdAt: -1 })
      .lean();

    let totalEarned = 0;
    let totalInEscrow = 0;
    const history = [];

    bookings.forEach(b => {
      totalEarned += (b.releasedAmount || 0);
      totalInEscrow += (b.amountPaid - (b.releasedAmount || 0));

      history.push({
        id: b._id,
        date: b.createdAt,
        type: 'Booking',
        trainee: b.trainee?.username || 'Client',
        program: b.program?.title,
        amount: b.amountPaid,
        released: b.releasedAmount || 0,
        status: b.status
      });
    });

    return NextResponse.json({
      walletBalance: user.trainerInfo?.escrowBalance || 0,
      totalEarned,
      totalInEscrow,
      history
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 });
  }
}
