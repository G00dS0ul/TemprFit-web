import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  await connectDB();
  
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

  const { username: identifier } = params;
  if (!identifier) return NextResponse.json({ error: 'Target user is required' }, { status: 400 });

  try {
    let targetUser = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      targetUser = await User.findById(identifier);
    }
    if (!targetUser) {
      targetUser = await User.findOne({ username: { $regex: new RegExp(`^${identifier}$`, 'i') } });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentLikes = targetUser.profileLikes || [];
    const hasLiked = currentLikes.some(f => String(f) === String(user._id));
    
    if (hasLiked) {
      // Unlike
      await User.findByIdAndUpdate(targetUser._id, { $pull: { profileLikes: user._id } });
      const updated = await User.findById(targetUser._id).select('profileLikes');
      return NextResponse.json({ 
        success: true, 
        hasLiked: false, 
        likesCount: updated.profileLikes?.length || 0 
      });
    } else {
      // Like
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { profileLikes: user._id } });
      
      if (String(user._id) !== String(targetUser._id)) {
        try {
          await Notification.create({
            user: targetUser._id,
            type: 'social',
            title: 'Profile Liked! ❤️',
            message: `@${user.username} liked your profile.`,
            link: `/u/${targetUser.username}`
          });
        } catch (notifErr) {
          console.warn('Like notification error:', notifErr?.message || notifErr);
        }
      }

      const updated = await User.findById(targetUser._id).select('profileLikes');
      return NextResponse.json({ 
        success: true, 
        hasLiked: true, 
        likesCount: updated.profileLikes?.length || 0 
      });
    }
  } catch (err) {
    console.error('Like toggle error:', err);
    return NextResponse.json({ error: 'Server error while toggling like' }, { status: 500 });
  }
}
