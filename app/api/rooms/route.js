import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// Seed or ensure the default TemprFit preset community room exists
// AND make sure ALL registered users are members, with Admin as the Creator/Host
async function ensurePresetRoom(currentUser) {
  try {
    const presets = await ChatRoom.find({ 
      title: 'TemprFit Global HQ • The Official Hub'
    }).sort({ createdAt: 1 });
    let preset = presets[0];

    // If duplicates exist, clean them up
    if (presets.length > 1) {
      const extraIds = presets.slice(1).map(p => p._id);
      await ChatRoom.deleteMany({ _id: { $in: extraIds } });
    }

    // Find or create official TemprFit Admin user
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.findOne({ username: 'admin' });
    }
    if (!adminUser) {
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@temprfit.com',
        password: 'temprfit_admin_secret_pass',
        role: 'admin',
        plan: 'max',
        avatarUrl: 'https://api.dicebear.com/9.x/bottts/svg?seed=TemprFit-Admin',
        activeColor: '#38bdf8',
        activeBorder: 'neon'
      });
    } else if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      await adminUser.save();
    }

    // Get all user IDs in system so every user is automatically in TemprFit Global HQ
    const allUsers = await User.find({}).select('_id');
    const allUserIds = allUsers.map(u => u._id);

    if (!preset) {
      const hostId = adminUser._id;
      preset = await ChatRoom.create({
        title: 'TemprFit Global HQ • The Official Hub',
        subtitle: 'Welcome to TemprFit! The default public community room for all trainees.',
        description: 'Official TemprFit community space. Connect with athletes worldwide, ask workout questions, exchange nutrition tips, and celebrate daily PRs. Everyone belongs here!',
        icon: 'Sparkles',
        coverGradient: 'from-emerald-600 via-teal-700 to-slate-900',
        isPrivate: false,
        isPreset: true,
        creator: hostId,
        moderators: [hostId],
        members: allUserIds,
        comments: []
      });
    } else {
      let needsSave = false;
      // Ensure preset flag
      if (!preset.isPreset) {
        preset.isPreset = true;
        needsSave = true;
      }

      // Ensure creator is the official admin
      if (adminUser && String(preset.creator) !== String(adminUser._id)) {
        preset.creator = adminUser._id;
        if (!preset.moderators.some(m => String(m) === String(adminUser._id))) {
          preset.moderators.unshift(adminUser._id);
        }
        needsSave = true;
      }

      // Automatically sync all users into members
      const existingMemberSet = new Set((preset.members || []).map(m => String(m)));
      const missingUserIds = allUserIds.filter(id => !existingMemberSet.has(String(id)));
      if (missingUserIds.length > 0) {
        await ChatRoom.findByIdAndUpdate(preset._id, {
          $addToSet: { members: { $each: missingUserIds } }
        });
      }

      if (needsSave) {
        await preset.save();
      }
    }

    return preset;
  } catch (err) {
    console.error('Error ensuring preset room:', err);
  }
}

// GET all rooms (with member count, creator info)
export async function GET(req) {
  try {
    await connectDB();
    const user = await getSessionUser();

    // Ensure preset room exists and all users are members
    await ensurePresetRoom(user);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || 'all'; // all, my_rooms, joined
    const inviteCode = searchParams.get('inviteCode') || '';

    // If looking up by private invite code
    if (inviteCode) {
      const privateRoom = await ChatRoom.findOne({ inviteCode })
        .populate('creator', 'username avatarUrl plan activeColor activeBorder')
        .populate('moderators', 'username avatarUrl plan')
        .lean();

      if (privateRoom) {
        return NextResponse.json({
          rooms: [{
            ...privateRoom,
            memberCount: (privateRoom.members || []).length,
            commentCount: (privateRoom.comments || []).length,
            isMember: user ? (privateRoom.members || []).some(m => String(m) === String(user._id)) : false,
            isCreator: user ? String(privateRoom.creator?._id) === String(user._id) : false,
            isModerator: user ? (privateRoom.moderators || []).some(m => String(m._id || m) === String(user._id)) : false
          }]
        });
      }
    }

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (user) {
      if (filter === 'my_rooms') {
        query.creator = user._id;
      } else if (filter === 'joined') {
        query.members = user._id;
      } else {
        // 'all' filter: show public rooms OR private rooms where user is member/creator
        query.$or = [
          { isPrivate: { $ne: true } },
          { members: user._id },
          { creator: user._id }
        ];
      }
    } else {
      // Unauthenticated: only public rooms
      query.isPrivate = { $ne: true };
    }

    // Sort preset room first, then recent
    const rooms = await ChatRoom.find(query)
      .populate('creator', 'username avatarUrl plan activeColor activeBorder')
      .populate('moderators', 'username avatarUrl plan')
      .sort({ isPreset: -1, updatedAt: -1 })
      .lean();

    // Deduplicate by title to guarantee single preset room
    const seenTitles = new Set();
    const uniqueRooms = [];
    for (const r of rooms) {
      if (!seenTitles.has(r.title)) {
        seenTitles.add(r.title);
        uniqueRooms.push(r);
      }
    }

    const formatted = uniqueRooms.map(room => ({
      ...room,
      memberCount: (room.members || []).length,
      commentCount: (room.comments || []).length,
      isMember: user ? (room.members || []).some(m => String(m) === String(user._id)) : false,
      isCreator: user ? String(room.creator?._id) === String(user._id) : false,
      isModerator: user ? (room.moderators || []).some(m => String(m._id || m) === String(user._id)) : false
    }));

    return NextResponse.json({ rooms: formatted });
  } catch (error) {
    console.error('Fetch rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

// POST create a room
export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const body = await req.json();
    const { title, subtitle, description, isPrivate, icon, coverGradient } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Room title is required' }, { status: 400 });
    }

    const inviteCode = isPrivate ? crypto.randomBytes(6).toString('hex') : null;

    const newRoom = await ChatRoom.create({
      title: title.trim(),
      subtitle: (subtitle || '').trim(),
      description: (description || '').trim(),
      isPrivate: Boolean(isPrivate),
      inviteCode,
      isPreset: false,
      icon: icon || 'MessageSquare',
      coverGradient: coverGradient || 'from-emerald-600 to-teal-900',
      creator: user._id,
      moderators: [user._id],
      members: [user._id],
      comments: []
    });

    await newRoom.populate('creator', 'username avatarUrl plan activeColor activeBorder');

    return NextResponse.json({ success: true, room: newRoom }, { status: 201 });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
