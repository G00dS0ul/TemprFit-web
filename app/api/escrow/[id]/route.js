import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import EscrowTransaction from '@/models/EscrowTransaction';
import User from '@/models/User';

export async function GET(req, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const escrow = await EscrowTransaction.findById(params.id)
      .populate('trainer', 'username avatarUrl')
      .populate('trainee', 'username avatarUrl');

    if (!escrow) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Ensure the user is either the trainer or trainee
    if (escrow.trainer._id.toString() !== user._id.toString() && escrow.trainee._id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, escrow });
  } catch (error) {
    console.error('[API_ESCROW_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
