import mongoose from 'mongoose'

const ForumReplySchema = new mongoose.Schema(
  {
    thread: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

export default mongoose.models.ForumReply || mongoose.model('ForumReply', ForumReplySchema)
