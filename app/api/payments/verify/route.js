import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { xpAmount } = await req.json();
    if (!xpAmount) {
      return NextResponse.json({ error: 'XP amount required' }, { status: 400 });
    }

    // In a production app, we would query the Flutterwave verification endpoint
    // using the transaction ID to ensure the payment was actually successful
    // before granting the XP.

    user.xp = (user.xp || 0) + parseInt(xpAmount);
    await user.save();

    return NextResponse.json({ success: true, xp: user.xp });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
