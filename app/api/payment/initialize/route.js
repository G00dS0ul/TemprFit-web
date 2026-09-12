import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-dummy-key';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    await connectDB();
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const user = await User.findById(session._id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { plan, amount, type = 'subscription', trainerId, traineeNotes } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }
    if (type === 'subscription' && !plan) {
      return NextResponse.json({ error: 'Plan is required for subscriptions' }, { status: 400 });
    }
    if (type === 'escrow' && !trainerId) {
      return NextResponse.json({ error: 'Trainer ID is required for bookings' }, { status: 400 });
    }

    const tx_ref = `tx-${user._id}-${Date.now()}-${type}-${plan || trainerId}`;

    // Flutterwave Initialize Payment Payload
    const flwPayload = {
      tx_ref,
      amount: amount.toString(),
      currency: 'USD',
      redirect_url: `${BASE_URL}/api/payment/callback`,
      meta: {
        userId: user._id.toString(),
        plan: plan || '',
        type,
        trainerId: trainerId || '',
        traineeNotes: traineeNotes || '',
      },
      customer: {
        email: user.email,
        name: user.username || user.email,
      },
      customizations: {
        title: `TemprFit ${type === 'escrow' ? 'Booking' : (plan || 'Upgrade')}`,
        description: type === 'escrow' ? `Secure Escrow for Booking` : `Payment for ${plan || 'Boost'}`,
        logo: `${BASE_URL}/logo.png`, // Optional
      },
    };

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(flwPayload),
    });

    const data = await response.json();

    if (data.status === 'success') {
      return NextResponse.json({ link: data.data.link });
    } else {
      console.error('Flutterwave Error:', data);
      
      // If the dummy key fails, provide a clear error message to the user
      if (FLUTTERWAVE_SECRET_KEY === 'FLWSECK_TEST-dummy-key') {
         return NextResponse.json({ error: 'Flutterwave Secret Key is missing in .env file.' }, { status: 500 });
      }
      
      return NextResponse.json({ error: data.message || 'Failed to initialize payment gateway' }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment Init Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
