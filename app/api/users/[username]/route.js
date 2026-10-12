import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';
import Pod from '@/models/Pod';
import Moment from '@/models/Moment';
import ChatRoom from '@/models/ChatRoom';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const currentUser = await getSessionUser();
    
    // Case-insensitive regex match for username
    const username = params.username;
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
      .select('username name avatarUrl bio hobbies talents profession age sex fitnessProfile activeColor activeBorder xp checkInStreak totalCheckInStreak longestCheckInStreak currentStreak longestStreak plan badges followers following profileLikes createdAt privacySettings');
      
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check privacy settings: is profile hidden?
    const isOwner = currentUser && String(currentUser._id) === String(user._id);
    const isHidden = user.privacySettings?.isProfileHidden;

    if (isHidden && !isOwner) {
      return NextResponse.json({ 
        error: 'Profile is private', 
        isPrivate: true,
        user: {
          username: user.username,
          avatarUrl: user.avatarUrl,
          plan: user.plan
        }
      }, { status: 403 });
    }

    const userMoments = await Moment.find({ user: user._id, visibility: { $ne: 'hidden' } })
      .sort({ createdAt: -1 })
      .limit(10);

    // Aggregate total volume from completed workouts
    const volumeAgg = await WorkoutSession.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      { $group: { _id: null, totalVolume: { $sum: '$totalVolume' }, sessions: { $sum: 1 } } }
    ]);
    
    const stats = volumeAgg[0] || { totalVolume: 0, sessions: 0 };
    
    // Fetch pods the user is in
    const userPods = await Pod.find({ members: user._id }).select('name description image isPrivate').limit(5);

    // Fetch rooms the user has created or joined
    const userRooms = await ChatRoom.find({ 
      $or: [{ creator: user._id }, { members: user._id }] 
    }).select('title subtitle description icon isPrivate memberCount isPreset').limit(6).lean();

    const formattedRooms = userRooms.map(r => ({
      ...r,
      isCreator: String(r.creator) === String(user._id)
    }));

    // Follow and Like status for current user
    const isFollowing = currentUser ? (user.followers || []).some(f => String(f) === String(currentUser._id)) : false;
    const hasLiked = currentUser ? (user.profileLikes || []).some(f => String(f) === String(currentUser._id)) : false;

    return NextResponse.json({ 
      user,
      stats,
      pods: userPods,
      moments: userMoments,
      rooms: formattedRooms,
      isOwner,
      isFollowing,
      hasLiked,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      likesCount: user.profileLikes?.length || 0,
      messageXpFee: user.plan === 'max' ? (user.privacySettings?.messageXpFee || 0) : 0
    });
  } catch (error) {
    console.error('User profile fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
