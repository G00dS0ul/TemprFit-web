import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import User from '@/models/User';
import WorkoutSession from '@/models/WorkoutSession';
import Pod from '@/models/Pod';
import ChatRoom from '@/models/ChatRoom';
import {
  usernameParamSchema,
  publicUserProfileResponseSchema,
  privateProfileResponseSchema,
} from '@/lib/contracts/v1/community';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const currentUser = await getSessionUser();

    // 1. Validate route path parameter
    const parsedParams = usernameParamSchema.safeParse(params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Invalid username parameter format.', details: parsedParams.error.flatten() },
        { status: 400 }
      );
    }
    const { username } = parsedParams.data;

    // 2. Query target user case-insensitively
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
      .select(
        'username name avatarUrl bio hobbies talents profession age sex fitnessProfile ' +
        'activeColor activeBorder xp checkInStreak totalCheckInStreak longestCheckInStreak ' +
        'currentStreak longestStreak plan badges followers following profileLikes createdAt privacySettings'
      );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 3. Privacy check (P-38): is profile hidden?
    const isOwner = currentUser && String(currentUser._id) === String(user._id);
    const isHidden = user.privacySettings?.isProfileHidden;

    if (isHidden && !isOwner) {
      const privatePayload = privateProfileResponseSchema.parse({
        error: 'Profile is private',
        isPrivate: true,
        user: {
          username: user.username,
          avatarUrl: user.avatarUrl || null,
          plan: user.plan || 'free',
        },
      });
      return NextResponse.json(privatePayload, { status: 403 });
    }

    // 4. Aggregate completed workout sessions and total volume
    const volumeAgg = await WorkoutSession.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      { $group: { _id: null, totalVolume: { $sum: '$totalVolume' }, sessions: { $sum: 1 } } },
    ]);
    const stats = volumeAgg[0]
      ? { totalVolume: volumeAgg[0].totalVolume || 0, sessions: volumeAgg[0].sessions || 0 }
      : { totalVolume: 0, sessions: 0 };

    // 5. Query pods with P-38 privacy protection: filter private pods unless viewer is a member
    const podVisibilityOr = [{ isPrivate: { $ne: true } }];
    if (currentUser) {
      podVisibilityOr.push({ members: currentUser._id });
    }
    const userPods = await Pod.find({
      members: user._id,
      $or: podVisibilityOr,
    })
      .select('name description image isPrivate')
      .limit(5)
      .lean();

    // 6. Query chat rooms with P-38 privacy protection: filter private rooms unless viewer is creator or member
    const roomVisibilityOr = [{ isPrivate: { $ne: true } }];
    if (currentUser) {
      roomVisibilityOr.push({ creator: currentUser._id }, { members: currentUser._id });
    }
    const userRooms = await ChatRoom.find({
      $and: [
        { $or: [{ creator: user._id }, { members: user._id }] },
        { $or: roomVisibilityOr },
      ],
    })
      .select('title subtitle description icon isPrivate memberCount isPreset creator')
      .limit(6)
      .lean();

    const formattedRooms = userRooms.map(r => ({
      _id: String(r._id),
      title: r.title,
      subtitle: r.subtitle || undefined,
      description: r.description || undefined,
      icon: r.icon || undefined,
      isPrivate: Boolean(r.isPrivate),
      memberCount: r.memberCount || 0,
      isPreset: Boolean(r.isPreset),
      isCreator: String(r.creator) === String(user._id),
    }));

    // 7. Follow and Like viewer status
    const isFollowing = currentUser
      ? (user.followers || []).some(f => String(f) === String(currentUser._id))
      : false;
    const hasLiked = currentUser
      ? (user.profileLikes || []).some(f => String(f) === String(currentUser._id))
      : false;

    // 8. Sanitize public projection (P-38: omit raw ObjectId arrays and private metrics)
    const userAge = user.age ?? user.fitnessProfile?.bodyMetrics?.age ?? user.fitnessProfile?.age ?? null;
    const safeUser = {
      _id: String(user._id),
      username: user.username,
      name: user.name || null,
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || null,
      hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
      talents: Array.isArray(user.talents) ? user.talents : [],
      profession: user.profession || null,
      age: userAge,
      sex: user.sex || null,
      plan: user.plan || 'free',
      activeColor: user.activeColor || null,
      activeBorder: user.activeBorder || null,
      xp: user.xp || 0,
      checkInStreak: user.checkInStreak || 0,
      totalCheckInStreak: user.totalCheckInStreak || 0,
      longestCheckInStreak: user.longestCheckInStreak || 0,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      badges: user.badges || [],
      createdAt: user.createdAt,
      goal: user.fitnessProfile?.primaryGoal || undefined,
      experience: user.fitnessProfile?.experienceLevel || undefined,
    };

    const payload = publicUserProfileResponseSchema.parse({
      user: safeUser,
      stats,
      pods: userPods.map(p => ({
        _id: String(p._id),
        name: p.name,
        description: p.description || undefined,
        image: p.image || undefined,
        isPrivate: Boolean(p.isPrivate),
      })),
      rooms: formattedRooms,
      isOwner: Boolean(isOwner),
      isFollowing: Boolean(isFollowing),
      hasLiked: Boolean(hasLiked),
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      likesCount: user.profileLikes?.length || 0,
      messageXpFee: user.plan === 'max' ? (user.privacySettings?.messageXpFee || 0) : 0,
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('[v1/users/[username]] GET Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve athlete profile' }, { status: 500 });
  }
}
