import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import ChatRoom from '@/models/ChatRoom';
import RoomMessage from '@/models/RoomMessage';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

// GET room details + live messages
export async function GET(req, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    const { id } = params;

    const room = await ChatRoom.findById(id)
      .setOptions({ strictPopulate: false })
      .populate('creator', 'username avatarUrl plan activeColor activeBorder role')
      .populate('moderators', 'username avatarUrl plan activeColor activeBorder role')
      .populate('members', 'username avatarUrl plan activeColor activeBorder role')
      .populate({ path: 'comments.user', select: 'username avatarUrl plan activeColor activeBorder role', strictPopulate: false })
      .populate({ path: 'comments.replies.user', select: 'username avatarUrl plan activeColor activeBorder role', strictPopulate: false })
      .lean();

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // If official TemprFit Global HQ room, ensure creator is the official Admin
    if (room && (room.isPreset || room.title?.includes('TemprFit Global HQ')) && room.creator?.role !== 'admin') {
      let adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) adminUser = await User.findOne({ username: 'admin' });
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

      await ChatRoom.findByIdAndUpdate(id, {
        creator: adminUser._id,
        $addToSet: { moderators: adminUser._id, members: adminUser._id },
        isPreset: true
      });
      room.creator = {
        _id: adminUser._id,
        username: adminUser.username,
        avatarUrl: adminUser.avatarUrl,
        plan: adminUser.plan,
        activeColor: adminUser.activeColor,
        activeBorder: adminUser.activeBorder,
        role: 'admin'
      };
      room.isPreset = true;
    }

    // Check if user is banned
    if (user && (room.bannedUsers || []).some(b => String(b) === String(user._id))) {
      return NextResponse.json({ error: 'You are banned from this room' }, { status: 403 });
    }

    // Check private room access: allowed if member, creator, or valid invite code query
    const { searchParams } = new URL(req.url);
    const codeQuery = searchParams.get('code');
    const isMemberCheck = user ? (room.members || []).some(m => String(m._id || m) === String(user._id)) : false;
    const isCreatorCheck = user ? String(room.creator?._id || room.creator) === String(user._id) : false;

    if (room.isPrivate && !isMemberCheck && !isCreatorCheck) {
      if (codeQuery && codeQuery === room.inviteCode) {
        // Invite code matches, allow view/join
      } else {
        return NextResponse.json({ error: 'This room is private. An invite link is required to join.', isPrivate: true }, { status: 403 });
      }
    }

    // Fetch room messages
    const messages = await RoomMessage.find({ roomId: id })
      .populate('sender', 'username avatarUrl plan activeColor activeBorder role')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    const isMember = isMemberCheck;
    const isCreator = isCreatorCheck;
    const isModerator = user ? (room.moderators || []).some(m => String(m._id || m) === String(user._id)) : false;

    return NextResponse.json({
      room,
      messages,
      isMember,
      isCreator,
      isModerator
    });
  } catch (error) {
    console.error('Get room error:', error);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}

// PATCH edit room details, moderators, remove members
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const { id } = params;
    const room = await ChatRoom.findById(id);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const isCreator = String(room.creator) === String(user._id) || user.role === 'admin';
    const isModerator = (room.moderators || []).some(m => String(m) === String(user._id));

    if (!isCreator && !isModerator) {
      return NextResponse.json({ error: 'Permission denied: creator or moderator required' }, { status: 403 });
    }

    const body = await req.json();

    // 1. Edit Room Message Text (Author or Moderator)
    if (body.action === 'edit_message' && body.messageId) {
      const msg = await RoomMessage.findById(body.messageId);
      if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

      const isAuthor = String(msg.sender) === String(user._id);
      if (!isAuthor && !isCreator && !isModerator) {
        return NextResponse.json({ error: 'Permission denied to edit message' }, { status: 403 });
      }

      if (!body.text || !body.text.trim()) {
        return NextResponse.json({ error: 'Message text cannot be empty' }, { status: 400 });
      }

      msg.text = body.text.trim();
      msg.isEdited = true;
      msg.editedAt = new Date();
      await msg.save();
      await msg.populate('sender', 'username avatarUrl plan activeColor activeBorder role');

      return NextResponse.json({ success: true, message: msg });
    }

    // Editable by Creator or Moderator
    if (typeof body.title === 'string' && body.title.trim()) {
      room.title = body.title.trim();
    }
    if (typeof body.subtitle === 'string') {
      room.subtitle = body.subtitle.trim();
    }
    if (typeof body.description === 'string') {
      room.description = body.description.trim();
    }
    if (typeof body.isPrivate === 'boolean') {
      room.isPrivate = body.isPrivate;
      if (body.isPrivate && !room.inviteCode) {
        const crypto = await import('crypto');
        room.inviteCode = crypto.randomBytes(6).toString('hex');
      }
    }
    if (typeof body.icon === 'string') {
      room.icon = body.icon;
    }

    // Only Creator can add/remove moderators
    if (body.moderatorAction && isCreator) {
      const { targetUserId, action } = body.moderatorAction; // 'add' or 'remove'
      if (action === 'add') {
        if (!room.moderators.some(m => String(m) === String(targetUserId))) {
          room.moderators.push(targetUserId);
        }
      } else if (action === 'remove') {
        if (String(targetUserId) !== String(room.creator)) {
          room.moderators = room.moderators.filter(m => String(m) !== String(targetUserId));
        }
      }
    }

    // Creator or Moderator can remove a member from room
    if (body.memberAction) {
      const { targetUserId, action } = body.memberAction;
      if (action === 'remove' || action === 'kick') {
        // cannot remove creator
        if (String(targetUserId) !== String(room.creator)) {
          room.members = room.members.filter(m => String(m) !== String(targetUserId));
          room.moderators = room.moderators.filter(m => String(m) !== String(targetUserId));
        }
      }
    }

    await room.save();
    await room.populate([
      { path: 'creator', select: 'username avatarUrl plan role', strictPopulate: false },
      { path: 'moderators', select: 'username avatarUrl plan role', strictPopulate: false },
      { path: 'members', select: 'username avatarUrl plan role', strictPopulate: false },
      { path: 'comments.user', select: 'username avatarUrl plan role', strictPopulate: false },
      { path: 'comments.replies.user', select: 'username avatarUrl plan role', strictPopulate: false }
    ]);

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Update room error:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

// DELETE action: delete message or delete comment
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const { id: roomId } = params;
    const room = await ChatRoom.findById(roomId);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const isCreator = String(room.creator) === String(user._id) || user.role === 'admin';
    const isModerator = (room.moderators || []).some(m => String(m) === String(user._id));

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('messageId');
    const commentId = searchParams.get('commentId');

    if (messageId) {
      const msg = await RoomMessage.findById(messageId);
      if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

      const isAuthor = String(msg.sender) === String(user._id);
      if (!isAuthor && !isCreator && !isModerator) {
        return NextResponse.json({ error: 'Permission denied to delete message' }, { status: 403 });
      }

      await RoomMessage.findByIdAndDelete(messageId);
      return NextResponse.json({ success: true, deletedMessageId: messageId });
    }

    if (commentId) {
      const commentIndex = room.comments.findIndex(c => String(c._id) === String(commentId));
      if (commentIndex === -1) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

      const comment = room.comments[commentIndex];
      const isAuthor = String(comment.user) === String(user._id);
      if (!isAuthor && !isCreator && !isModerator) {
        return NextResponse.json({ error: 'Permission denied to delete comment' }, { status: 403 });
      }

      room.comments.splice(commentIndex, 1);
      await room.save();
      return NextResponse.json({ success: true, deletedCommentId: commentId });
    }

    return NextResponse.json({ error: 'No item specified to delete' }, { status: 400 });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

// POST actions: send message, join/leave, add comment, like message, reply message, like comment, reply comment
export async function POST(req, { params }) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const { id } = params;
    const room = await ChatRoom.findById(id);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const body = await req.json();
    const action = body.action || 'send_message';

    // 1. Join / Leave room
    if (action === 'join') {
      if (!room.members.some(m => String(m) === String(user._id))) {
        room.members.push(user._id);
        await room.save();
      }
      return NextResponse.json({ success: true, message: 'Joined room' });
    }

    if (action === 'leave') {
      if (String(room.creator) === String(user._id)) {
        return NextResponse.json({ error: 'Creator cannot leave their own room' }, { status: 400 });
      }
      room.members = room.members.filter(m => String(m) !== String(user._id));
      room.moderators = room.moderators.filter(m => String(m) !== String(user._id));
      await room.save();
      return NextResponse.json({ success: true, message: 'Left room' });
    }

    // 2. Add comment to room wall
    if (action === 'add_comment') {
      const commentText = (body.text || '').trim();
      if (!commentText) {
        return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
      }

      room.comments.unshift({
        user: user._id,
        text: commentText,
        likes: [],
        replies: [],
        createdAt: new Date()
      });

      await room.save();
      await room.populate([
        { path: 'comments.user', select: 'username avatarUrl plan activeColor activeBorder role', strictPopulate: false },
        { path: 'comments.replies.user', select: 'username avatarUrl plan activeColor activeBorder role', strictPopulate: false }
      ]);

      return NextResponse.json({ success: true, comments: room.comments });
    }

    // 3. Like / Unlike comment
    if (action === 'like_comment') {
      const { commentId } = body;
      const targetComment = room.comments.id(commentId);
      if (!targetComment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

      targetComment.likes = targetComment.likes || [];
      const hasLiked = targetComment.likes.some(l => String(l) === String(user._id));
      if (hasLiked) {
        targetComment.likes = targetComment.likes.filter(l => String(l) !== String(user._id));
      } else {
        targetComment.likes.push(user._id);
      }
      await room.save();
      await room.populate([
        { path: 'comments.user', select: 'username avatarUrl plan activeColor activeBorder role', strictPopulate: false },
        { path: 'comments.replies.user', select: 'username avatarUrl plan activeColor activeBorder role', strictPopulate: false }
      ]);
      return NextResponse.json({ success: true, comments: room.comments });
    }

    // 4. Reply to comment
    if (action === 'reply_comment') {
      const { commentId, text: replyText } = body;
      const targetComment = room.comments.id(commentId);
      if (!targetComment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

      if (!replyText || !replyText.trim()) {
        return NextResponse.json({ error: 'Reply text required' }, { status: 400 });
      }

      targetComment.replies = targetComment.replies || [];
      targetComment.replies.push({
        user: user._id,
        text: replyText.trim(),
        createdAt: new Date()
      });

      await room.save();
      await room.populate([
        { path: 'comments.user', select: 'username avatarUrl plan activeColor activeBorder role', strictPopulate: false },
        { path: 'comments.replies.user', select: 'username avatarUrl plan activeColor activeBorder role', strictPopulate: false }
      ]);
      return NextResponse.json({ success: true, comments: room.comments });
    }

    // 5. Send live chat message in room
    if (action === 'send_message') {
      const messageText = (body.text || '').trim();
      if (!messageText) {
        return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
      }

      // Automatically make them a member if not already
      if (!room.members.some(m => String(m) === String(user._id))) {
        room.members.push(user._id);
        await room.save();
      }

      const msgData = {
        roomId: room._id,
        sender: user._id,
        text: messageText,
        likes: []
      };

      if (body.replyTo && body.replyTo.messageId) {
        msgData.replyTo = body.replyTo;
      }

      const newMsg = await RoomMessage.create(msgData);
      await newMsg.populate('sender', 'username avatarUrl plan activeColor activeBorder role');

      return NextResponse.json({ success: true, message: newMsg });
    }

    // 6. Like / Unlike live message
    if (action === 'like_message') {
      const { messageId } = body;
      const msg = await RoomMessage.findById(messageId);
      if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

      msg.likes = msg.likes || [];
      const hasLiked = msg.likes.some(l => String(l) === String(user._id));
      if (hasLiked) {
        msg.likes = msg.likes.filter(l => String(l) !== String(user._id));
      } else {
        msg.likes.push(user._id);
      }
      await msg.save();
      await msg.populate('sender', 'username avatarUrl plan activeColor activeBorder role');

      return NextResponse.json({ success: true, message: msg });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Room action error:', error);
    return NextResponse.json({ error: 'Failed to perform room action' }, { status: 500 });
  }
}
