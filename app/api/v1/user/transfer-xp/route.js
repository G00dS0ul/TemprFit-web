import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUser } from '@/lib/auth';
import {
  userTransferXpRequestSchema,
  userTransferXpResponseSchema,
} from '@/lib/contracts/v1/user';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    const sender = await getSessionUser();
    if (!sender) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const parseResult = userTransferXpRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid transfer details.',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { targetUsername, amount } = parseResult.data;

    const freshSender = await User.findById(sender._id);
    if (!freshSender) {
      return NextResponse.json({ error: 'Sender account not found.' }, { status: 404 });
    }

    if ((freshSender.xp || 0) < amount) {
      return NextResponse.json(
        { error: 'Insufficient XP balance for transfer.' },
        { status: 400 }
      );
    }

    const receiver = await User.findOne({
      username: new RegExp('^' + targetUsername + '$', 'i'),
    });
    if (!receiver) {
      return NextResponse.json(
        { error: 'Recipient username not found.' },
        { status: 404 }
      );
    }

    if (freshSender._id.toString() === receiver._id.toString()) {
      return NextResponse.json(
        { error: 'You cannot send XP to yourself.' },
        { status: 400 }
      );
    }

    freshSender.xp = (freshSender.xp || 0) - amount;
    receiver.xp = (receiver.xp || 0) + amount;

    await freshSender.save();
    await receiver.save();

    const validated = userTransferXpResponseSchema.parse({
      success: true,
      newXp: freshSender.xp,
    });
    return NextResponse.json(validated);
  } catch (error) {
    console.error('[v1/user/transfer-xp] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to complete XP transfer.' },
      { status: 500 }
    );
  }
}
