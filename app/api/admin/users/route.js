import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUser, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function verifyAdminCaller() {
  // 1. Check session user with role === 'admin'
  const sessionUser = await getSessionUser();
  if (sessionUser && sessionUser.role === 'admin') {
    return sessionUser;
  }

  // 2. Check admin_token cookie (cryptographic JWT or legacy fallback)
  try {
    const adminCookie = cookies().get('admin_token')?.value;
    if (adminCookie) {
      if (adminCookie === 'true') {
        return { role: 'admin', legacy: true };
      }
      const adminPayload = verifyToken(adminCookie);
      if (adminPayload?.role === 'admin' || adminPayload?.isAdmin) {
        return adminPayload;
      }
    }
  } catch {}

  return null;
}

export async function GET(req) {
  await connectDB();

  const admin = await verifyAdminCaller();
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const role = searchParams.get('role') || '';
  const plan = searchParams.get('plan') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;

  const filter = {};
  if (q) {
    filter.$or = [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;
  if (plan) filter.plan = plan;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
}

// DELETE a user
export async function DELETE(req) {
  await connectDB();

  const admin = await verifyAdminCaller();
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  await User.findByIdAndDelete(userId);
  return NextResponse.json({ success: true });
}

// PATCH — update user role, plan, or suspend
export async function PATCH(req) {
  await connectDB();

  const admin = await verifyAdminCaller();
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { userId, updates } = await req.json();
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const allowed = {};
  if (updates.role && ['user', 'trainer', 'admin'].includes(updates.role)) allowed.role = updates.role;
  if (updates.plan && ['free', 'pro', 'max'].includes(updates.plan)) allowed.plan = updates.plan;
  if (typeof updates.suspended === 'boolean') allowed.suspended = updates.suspended;

  let newlyApproved = false;
  if (typeof updates.isApproved === 'boolean') {
    allowed['trainerInfo.isApproved'] = updates.isApproved;
    if (updates.isApproved === true) {
      const existingUser = await User.findById(userId).lean();
      if (existingUser && (!existingUser.trainerInfo || !existingUser.trainerInfo.isApproved)) {
        newlyApproved = true;
      }
    }
  }

  const user = await User.findByIdAndUpdate(userId, { $set: allowed }, { new: true }).select('-password').lean();

  if (newlyApproved) {
    const { default: Notification } = await import('@/models/Notification');
    await Notification.create({
      user: userId,
      title: 'Profile Approved! 🎉',
      message: 'Your trainer application has been approved by the admin. Your profile is now live, and you can start accepting clients!',
      type: 'system',
      link: '/trainer-dashboard',
    });
  }

  return NextResponse.json({ user });
}
