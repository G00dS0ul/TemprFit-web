import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import EscrowTransaction from '@/models/EscrowTransaction';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || '';

  const filter = {};
  if (statusFilter) filter.status = statusFilter;

  if (user.role === 'admin') {
    // Admin sees all escrow transactions
  } else if (user.role === 'trainer') {
    filter.trainer = user._id;
  } else {
    filter.trainee = user._id;
  }

  const transactions = await EscrowTransaction.find(filter)
    .populate('trainer', 'username email avatarUrl')
    .populate('trainee', 'username email avatarUrl')
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ transactions });
}

export async function PATCH(request) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const { transactionId, action, amountToRelease } = await request.json(); // action = 'release' or 'refund'

  const tx = await EscrowTransaction.findById(transactionId).populate('trainer trainee');
  if (!tx) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  if (tx.status !== 'held' && tx.status !== 'disputed') {
    return NextResponse.json({ error: 'Transaction is already resolved' }, { status: 400 });
  }

  // Authorization check
  const isAdmin = user.role === 'admin';
  const isTrainee = tx.trainee._id.toString() === user._id.toString();

  if (action === 'refund' && !isAdmin) {
    return NextResponse.json({ error: 'Only admins can issue refunds' }, { status: 403 });
  }
  if (action === 'release' && (!isAdmin && !isTrainee)) {
    return NextResponse.json({ error: 'Only the trainee or an admin can release funds' }, { status: 403 });
  }

  if (action === 'release') {
    const remainingToRelease = tx.trainerEarnings - (tx.releasedAmount || 0);
    const releaseVal = amountToRelease ? Math.min(amountToRelease, remainingToRelease) : remainingToRelease;

    if (releaseVal <= 0) {
      return NextResponse.json({ error: 'No funds left to release' }, { status: 400 });
    }

    tx.releasedAmount = (tx.releasedAmount || 0) + releaseVal;
    
    if (tx.releasedAmount >= tx.trainerEarnings) {
      tx.status = 'released';
      tx.resolvedBy = user._id;
      tx.resolvedAt = new Date();
    }

    // Update trainer balance
    await User.findByIdAndUpdate(tx.trainer._id, {
      $inc: { 'trainerInfo.escrowBalance': releaseVal },
    });

  } else if (action === 'refund') {
    tx.status = 'refunded';
    tx.resolvedBy = user._id;
    tx.resolvedAt = new Date();
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  await tx.save();
  return NextResponse.json({ success: true, transaction: tx });
}
