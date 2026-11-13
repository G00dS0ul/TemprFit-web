import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { getSessionUser } from '@/lib/auth';
import {
  usernameParamSchema,
  followToggleResponseSchema,
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

    if (String(user._id) === String(targetUser._id)) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    const isFollowing = targetUser.followers && targetUser.followers.some(f => String(f) === String(user._id));

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: user._id } });
      await User.findByIdAndUpdate(user._id, { $pull: { following: targetUser._id } });

      const updated = await User.findById(targetUser._id).select('followers');
      const payload = followToggleResponseSchema.parse({
        success: true,
        isFollowing: false,
        followersCount: updated.followers?.length || 0,
      });
      return NextResponse.json(payload, { status: 200 });
    } else {
      // Follow
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: user._id } });
      await User.findByIdAndUpdate(user._id, { $addToSet: { following: targetUser._id } });

      try {
        await Notification.create({
          user: targetUser._id,
          type: 'social',
          title: 'New Follower! 👤',
          message: `@${user.username} is now following you.`,
          link: `/u/${user.username}`,
        });
      } catch (notifErr) {
        console.warn('[v1/users/[username]/follow] Notification creation warning:', notifErr?.message || notifErr);
      }

      const updated = await User.findById(targetUser._id).select('followers');
      const payload = followToggleResponseSchema.parse({
        success: true,
        isFollowing: true,
        followersCount: updated.followers?.length || 0,
      });
      return NextResponse.json(payload, { status: 200 });
    }
  } catch (err) {
    console.error('[v1/users/[username]/follow] Error:', err);
    return NextResponse.json({ error: 'Server error while toggling follow' }, { status: 500 });
  }
}
