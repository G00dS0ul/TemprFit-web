import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SystemConfig from '@/models/SystemConfig';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    await connectDB();
    
    // Check if the master password has been changed in SystemConfig
    const config = await SystemConfig.findOne({ key: 'ADMIN_PASSWORD' });
    const masterPassword = config ? config.value : 'EDSHEERAN11';

    if (password !== masterPassword) {
      return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
    }

    // Set an admin cookie
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set('admin_token', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Admin Auth Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
