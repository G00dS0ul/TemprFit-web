import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { verifyToken, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bio, specialties, age, experienceYears, mediaGallery, introVideoUrl, resumeUrl, price, location, trainingMode } = await request.json();

    if (!bio || !specialties) {
      return NextResponse.json({ error: 'Bio and specialties are required.' }, { status: 400 });
    }
    
    if (!mediaGallery || mediaGallery.length < 2) {
      return NextResponse.json({ error: 'At least 2 photos are required.' }, { status: 400 });
    }

    await connectDB();
    
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'trainer') {
      return NextResponse.json({ error: 'User is already a trainer' }, { status: 400 });
    }

    user.role = 'trainer';
    user.trainerInfo = {
      bio: String(bio),
      specialties: typeof specialties === 'string' 
        ? specialties.split(',').map(s => s.trim()).filter(Boolean) 
        : (Array.isArray(specialties) ? specialties : []),
      price: parseInt(price, 10) || 50,
      location: String(location || 'Remote'),
      trainingMode: ['physical', 'remote', 'hybrid'].includes(trainingMode) ? trainingMode : 'remote',
      isApproved: false,
      escrowBalance: 0,
      isFeatured: false,
      isVerified: false,
      views: 0,
      likes: [],
      mediaGallery: Array.isArray(mediaGallery) ? mediaGallery : [],
      introVideoUrl: introVideoUrl || '',
      resumeUrl: resumeUrl || '',
      experienceYears: parseInt(experienceYears, 10) || 0,
      expertise: typeof specialties === 'string' 
        ? specialties.split(',').map(s => s.trim()).filter(Boolean) 
        : (Array.isArray(specialties) ? specialties : []),
    };

    if (age) {
      user.age = parseInt(age, 10) || user.age;
    }

    await user.save();

    // Notify admins about the new trainer application
    const admins = await User.find({ role: 'admin' }).select('_id');
    if (admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        user: admin._id,
        title: 'New Trainer Application',
        message: `${user.username} has applied to be a trainer. Please review their profile.`,
        type: 'system',
        link: '/admin'
      }));
      await Notification.insertMany(adminNotifications);
    }

    // Sign a new token since the role changed
    const newToken = signToken({ userId: user._id.toString(), role: user.role });
    const response = NextResponse.json({ user: user.toSafeObject() }, { status: 200 });
    
    response.cookies.set(AUTH_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AUTH_COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Trainer upgrade error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
