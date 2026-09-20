import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function POST(req) {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { xpAmount } = await req.json();
    if (!xpAmount) {
      return NextResponse.json({ error: 'XP amount required' }, { status: 400 });
    }

    // In a production app, we would query the Flutterwave verification endpoint
    // using the transaction ID to ensure the payment was actually successful
    // before granting the XP.
    
    await connectDB();
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.xp = (user.xp || 0) + parseInt(xpAmount);
    await user.save();

    return NextResponse.json({ success: true, xp: user.xp });
  } catch (error) {
    console.error('Payment verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
