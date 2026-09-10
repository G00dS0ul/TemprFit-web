import mongoose from 'mongoose'

// Deliberately does NOT store the video or any frame images — only the
// issues extracted client-side from the pose landmarks, plus the AI's
// plain-language summary of them. Keeps this feature storage-free.
const FormCheckSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exerciseSlug: {
      type: String,
      required: true,
      enum: ['squat', 'push-up', 'plank', 'lunge', 'deadlift'],
    },
    videoDurationSeconds: { type: Number, default: null },
    flaggedIssues: [
      {
        issueType: { type: String, required: true },
        label: { type: String, required: true },
        timestampSeconds: { type: Number, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        frameCount: { type: Number, default: 1 }, // how many sampled frames triggered this
      },
    ],
    aiSummary: { type: String, default: null },
  },
  { timestamps: true }
)

FormCheckSessionSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.FormCheckSession ||
  mongoose.model('FormCheckSession', FormCheckSessionSchema)
