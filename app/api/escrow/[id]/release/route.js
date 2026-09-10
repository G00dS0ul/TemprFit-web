import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import EscrowTransaction from '@/models/EscrowTransaction';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(req, { params }) {
  await connectDB();
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { id } = params;
  
  try {
    const { milestoneId } = await req.json();
    
    const transaction = await EscrowTransaction.findById(id).populate('trainer trainee');
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // Only the trainee can release funds to the trainer
    if (transaction.trainee._id.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Only the trainee can release funds' }, { status: 403 });
    }

    const milestone = transaction.milestones.find(m => m.id === milestoneId);
    if (!milestone) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    
    if (milestone.status === 'completed') {
      return NextResponse.json({ error: 'Milestone already completed' }, { status: 400 });
    }
    
    if (milestone.status === 'locked') {
      return NextResponse.json({ error: 'Cannot release a locked milestone' }, { status: 400 });
    }

    // Mark current as completed
    milestone.status = 'completed';
    
    // Unlock the next milestone
    const nextMilestone = transaction.milestones.find(m => m.id === milestoneId + 1);
    if (nextMilestone) {
      nextMilestone.status = 'pending';
    } else {
      // If no next milestone, the entire transaction is completed
      transaction.status = 'released';
    }

    // Calculate release amount
    const releaseAmount = (transaction.trainerEarnings * milestone.percent) / 100;
    transaction.releasedAmount += releaseAmount;
    
    await transaction.save();

    // Update trainer's escrow balance
    const trainerUser = await User.findById(transaction.trainer._id);
    if (!trainerUser.trainerInfo) trainerUser.trainerInfo = {};
    trainerUser.trainerInfo.escrowBalance = (trainerUser.trainerInfo.escrowBalance || 0) + releaseAmount;
    await trainerUser.save();

    // Notify trainer
    await Notification.create({
      user: transaction.trainer._id,
      title: 'Funds Released!',
      message: `${user.username} has released ${releaseAmount.toFixed(2)} for milestone: ${milestone.label}.`,
      type: 'system',
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to release funds' }, { status: 500 });
  }
}
