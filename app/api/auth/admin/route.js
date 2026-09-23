import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import SystemConfig from '@/models/SystemConfig';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    await connectDB();

    // Check SystemConfig or ADMIN_PASSWORD environment variable
    const config = await SystemConfig.findOne({ key: 'ADMIN_PASSWORD' });
    const masterPassword = config?.value || process.env.ADMIN_PASSWORD;

    if (!masterPassword) {
      console.error('Admin password is not configured in SystemConfig or ADMIN_PASSWORD env.');
      return NextResponse.json({ error: 'Admin authentication is unconfigured on server.' }, { status: 500 });
    }

    if (password !== masterPassword) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    // Sign cryptographic admin JWT
    const adminToken = jwt.sign(
      { role: 'admin', isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set signed admin cookie and return token in body
    const response = NextResponse.json({ success: true, token: adminToken }, { status: 200 });
    response.cookies.set('admin_token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Admin Auth Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
