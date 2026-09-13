import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import Booking from '@/models/Booking';
import TrainerProgram from '@/models/TrainerProgram';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { programId, trainerId, transactionId, txRef, amountPaid } = await request.json();

    if (!programId || !trainerId || !transactionId) {
      return NextResponse.json({ error: 'Missing required booking data' }, { status: 400 });
    }

    await connectDB();

    // Verify program exists and active
    const program = await TrainerProgram.findById(programId);
    if (!program || !program.isActive) {
      return NextResponse.json({ error: 'Program is no longer active' }, { status: 404 });
    }

    // Ideally, we would also verify the Flutterwave transaction on the server-side here 
    // by making a request to Flutterwave's verify endpoint with `transactionId`
    // to ensure the amountPaid is correct and the payment was truly successful.
    // For this mockup, we'll assume the client-side success is valid.

    // Create the booking
    const booking = await Booking.create({
      program: programId,
      trainer: trainerId,
      trainee: payload.userId,
      amountPaid: amountPaid || program.price,
      totalSessions: program.totalSessions,
      status: 'active',
      escrowStatus: 'held',
      paymentRef: txRef || transactionId,
    });

    // Increment the program booking count
    program.bookingCount = (program.bookingCount || 0) + 1;
    await program.save();

    // In a real app, notify the trainer here via our Notification system

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
