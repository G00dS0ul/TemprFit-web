import mongoose from 'mongoose'

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
})

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
})

const MomentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaUrl: { type: String, default: '' },
  caption: { type: String, default: '' },
  sharedLink: { type: String, default: '' },
  sharedTitle: { type: String, default: '' },
  sharedType: { type: String, enum: ['workout', 'diet', ''], default: '' },
  sharedPreview: { type: [String], default: [] },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  comments: [CommentSchema]
}, { timestamps: true })

delete mongoose.models.Moment
export default mongoose.model('Moment', MomentSchema)
