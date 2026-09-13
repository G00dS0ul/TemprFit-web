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

    // Get all bookings for this trainer
    const bookings = await Booking.find({ trainer: user._id })
      .populate('trainee', 'username email avatarUrl')
      .populate('program', 'title')
      .sort({ createdAt: -1 })
      .lean();

    // Map unique clients
    const clientsMap = new Map();
    bookings.forEach(b => {
      const traineeId = b.trainee._id.toString();
      if (!clientsMap.has(traineeId)) {
        clientsMap.set(traineeId, {
          user: b.trainee,
          activeProgram: b.status === 'active' ? b.program.title : null,
          totalPaid: b.amountPaid,
          bookingsCount: 1,
          lastBookingDate: b.createdAt
        });
      } else {
        const client = clientsMap.get(traineeId);
        client.totalPaid += b.amountPaid;
        client.bookingsCount += 1;
        if (b.status === 'active' && !client.activeProgram) {
          client.activeProgram = b.program.title;
        }
      }
    });

    const clients = Array.from(clientsMap.values());
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
