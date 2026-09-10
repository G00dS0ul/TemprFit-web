import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import CouponCode from '@/models/CouponCode';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(request) {
  try {
    await connectDB();
    const userSession = await getSessionUser();
    
    if (!userSession) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please enter a valid coupon code' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    const coupon = await CouponCode.findOne({ code: normalizedCode, isActive: true });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 });
    }

    // Check expiration of the code itself (if it has one)
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: 'This coupon code has expired' }, { status: 400 });
    }

    // Check if user already used this exact coupon
    const user = await User.findById(userSession._id);
    if (user.usedCoupons && user.usedCoupons.includes(coupon._id)) {
      return NextResponse.json({ error: 'You have already used this coupon code' }, { status: 400 });
    }

    // Apply the upgrade for 1 week
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    user.plan = coupon.planLevel;
    user.planExpiresAt = expiresAt;
    
    if (!user.usedCoupons) {
      user.usedCoupons = [];
    }
    user.usedCoupons.push(coupon._id);

    await user.save();

    await Notification.create({
      user: user._id,
      title: 'Plan Upgraded',
      message: `Your account has been upgraded to the ${coupon.planLevel.toUpperCase()} plan! You now have access to premium features.`,
      type: 'subscription',
    });

    return NextResponse.json({ 
      success: true, 
      plan: user.plan,
      expiresAt: user.planExpiresAt 
    });

  } catch (err) {
    console.error('Coupon Apply Error:', err);
    return NextResponse.json({ error: 'Failed to apply coupon' }, { status: 500 });
  }
}
