import mongoose from 'mongoose'

// One doc per user per ISO week (Monday-start). Cached so viewing the page
// doesn't burn a Gemini call every time — only generating/regenerating does.
const WeeklyReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true }, // Monday, midnight UTC
    summary: { type: String, required: true },
    recommendation: { type: String, required: true },
    statsSnapshot: {
      sessionsCompleted: Number,
      totalVolume: Number,
      newPRs: Number,
      sessionsGoal: Number,
    },
  },
  { timestamps: true }
)

WeeklyReportSchema.index({ user: 1, weekStart: 1 }, { unique: true })

export default mongoose.models.WeeklyReport ||
  mongoose.model('WeeklyReport', WeeklyReportSchema)
