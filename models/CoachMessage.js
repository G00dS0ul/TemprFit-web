import mongoose from 'mongoose'

// A single running conversation per user (not multiple named threads — that's
// a reasonable future add, not needed for the first real version of this).
const CoachMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
)

CoachMessageSchema.index({ user: 1, createdAt: 1 })

export default mongoose.models.CoachMessage ||
  mongoose.model('CoachMessage', CoachMessageSchema)
