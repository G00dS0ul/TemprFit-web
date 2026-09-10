import mongoose from 'mongoose'

const ForumThreadSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumCategory', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    views: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.models.ForumThread || mongoose.model('ForumThread', ForumThreadSchema)
