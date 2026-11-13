import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getSessionUser } from '@/lib/auth';
import {
  usernameParamSchema,
  likeToggleResponseSchema,
} from '@/lib/contracts/v1/community';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const parsedParams = usernameParamSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Invalid username parameter format.', details: parsedParams.error.flatten() },
        { status: 400 }
      );
    }
    const { username: identifier } = parsedParams.data;

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
      const payload = likeToggleResponseSchema.parse({
        success: true,
        hasLiked: false,
        likesCount: updated.profileLikes?.length || 0,
      });
      return NextResponse.json(payload, { status: 200 });
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
            link: `/u/${targetUser.username}`,
          });
        } catch (notifErr) {
          console.warn('[v1/users/[username]/like] Notification creation warning:', notifErr?.message || notifErr);
        }
      }

      const updated = await User.findById(targetUser._id).select('profileLikes');
      const payload = likeToggleResponseSchema.parse({
        success: true,
        hasLiked: true,
        likesCount: updated.profileLikes?.length || 0,
      });
      return NextResponse.json(payload, { status: 200 });
    }
  } catch (err) {
    console.error('[v1/users/[username]/like] Error:', err);
    return NextResponse.json({ error: 'Server error while toggling like' }, { status: 500 });
  }
}
