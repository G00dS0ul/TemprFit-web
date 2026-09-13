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

    const bookings = await Booking.find({ trainer: user._id }).lean();

    const revenueByMonth = {};
    const bookingsByMonth = {};
    let totalRevenue = 0;

    bookings.forEach(b => {
      const d = new Date(b.createdAt);
      const monthYear = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      if (!revenueByMonth[monthYear]) revenueByMonth[monthYear] = 0;
      if (!bookingsByMonth[monthYear]) bookingsByMonth[monthYear] = 0;

      revenueByMonth[monthYear] += b.amountPaid;
      bookingsByMonth[monthYear] += 1;
      totalRevenue += b.amountPaid;
    });

    const months = Object.keys(revenueByMonth);
    const revenueData = months.map(m => ({ label: m, value: revenueByMonth[m] }));
    const bookingsData = months.map(m => ({ label: m, value: bookingsByMonth[m] }));

    return NextResponse.json({
      revenueData,
      bookingsData,
      totalRevenue,
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
