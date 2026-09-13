import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import EscrowTransaction from '@/models/EscrowTransaction';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectDB();
  const sessionUser = await getSessionUser();
  
  const { cookies } = await import('next/headers');
  if (!sessionUser || (sessionUser.role !== 'admin' && cookies().get('admin_token')?.value !== 'true')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const bookings = await EscrowTransaction.find({})
      .populate('trainee', 'username email avatarUrl')
      .populate('trainer', 'username email avatarUrl')
      .populate('program', 'title')
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
