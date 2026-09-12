import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Moment from '@/models/Moment';

export async function POST(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { itemId, type, caption, title, preview } = await request.json();

    if (!itemId || !type) {
      return NextResponse.json({ error: 'Missing itemId or type' }, { status: 400 });
    }

    // Determine path for shared item based on type
    let sharedLink = '';
    if (type === 'workout') {
      sharedLink = `/workouts/${itemId}`;
    } else if (type === 'diet') {
      sharedLink = `/nutrition/meal-plans/${itemId}`; // Or wherever diet plans live
    } else {
      sharedLink = `/${type}/${itemId}`;
    }

    const newMoment = await Moment.create({
      user: user._id,
      caption: caption || `Check out my new ${type}!`,
      mediaUrl: '', // Allow empty for shared items
      sharedLink,
      sharedTitle: title || `Shared ${type}`,
      sharedType: type,
      sharedPreview: Array.isArray(preview) ? preview : [],
    });

    return NextResponse.json({ success: true, moment: newMoment });
  } catch (error) {
    console.error('Share to Moments Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
