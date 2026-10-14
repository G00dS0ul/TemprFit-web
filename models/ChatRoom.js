import mongoose from 'mongoose';

const ReplySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const CommentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 1500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [ReplySchema],
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const ChatRoomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    subtitle: { type: String, default: '', trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
    icon: { type: String, default: 'MessageSquare' },
    coverGradient: { type: String, default: 'from-blue-600 to-indigo-900' },
    isPrivate: { type: Boolean, default: false },
    inviteCode: { type: String, sparse: true },
    isPreset: { type: Boolean, default: false },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema]
  },
  { timestamps: true }
);

if (mongoose.models.ChatRoom) {
  delete mongoose.models.ChatRoom;
}

export default mongoose.model('ChatRoom', ChatRoomSchema);
