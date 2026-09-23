import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import EscrowTransaction from '@/models/EscrowTransaction';
import User from '@/models/User';

export async function POST(req) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[ESCROW CHECKOUT] Received body:', body);
    const { trainerId, amount, sessions, description, traineeNotes } = body;

    if (!trainerId || amount === undefined || sessions === undefined) {
      return NextResponse.json({ error: `Missing fields: trainerId=${!!trainerId}, amount=${amount}, sessions=${sessions}` }, { status: 400 });
    }

    await connectDB();

    // Verify trainer exists
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return NextResponse.json({ error: 'Invalid trainer' }, { status: 400 });
    }

    // Platform fee calculations (15% placeholder)
    const platformFee = amount * 0.15;
    const trainerEarnings = amount - platformFee;

    // Generate equal milestones based on number of sessions
    const milestones = [];
    const amountPerMilestone = Number((trainerEarnings / sessions).toFixed(2));
    
    let totalAssigned = 0;
    for (let i = 1; i <= sessions; i++) {
      const isLast = i === sessions;
      // Handle rounding on the last milestone
      const milestoneAmount = isLast ? Number((trainerEarnings - totalAssigned).toFixed(2)) : amountPerMilestone;
      
      milestones.push({
        id: i,
        label: `Session ${i}`,
        percent: Number(((milestoneAmount / trainerEarnings) * 100).toFixed(1)),
        status: i === 1 ? 'pending' : 'locked' // First milestone is ready to work, rest are locked
      });
      totalAssigned += milestoneAmount;
    }

    // Create the Escrow Transaction
    const escrow = await EscrowTransaction.create({
      trainer: trainerId,
      trainee: user._id,
      amount,
      platformFee,
      trainerEarnings,
      status: 'held',
      description,
      traineeNotes,
      milestones,
      releasedAmount: 0
    });

    // Update trainer's escrow balance (this represents total held, not yet released/withdrawable)
    // Actually, usually escrow balance represents what they CAN withdraw. 
    // We'll leave escrowBalance unchanged until funds are actually released.

    return NextResponse.json({ success: true, escrowId: escrow._id });
  } catch (error) {
    console.error('[API_ESCROW_CHECKOUT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
