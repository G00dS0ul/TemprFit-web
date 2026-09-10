import mongoose from 'mongoose'

// One entry per user per calendar day (enforced by the unique index below).
// Logging again on the same day updates that day's entry instead of
// creating a duplicate point on the chart.
const WeightEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // normalized to midnight UTC of the day logged
    weight: { type: Number, required: true }, // stored in the unit the user entered it in
    unit: { type: String, enum: ['lbs', 'kg'], default: 'lbs' },
    bodyFatPercent: { type: Number, default: null },
  },
  { timestamps: true }
)

WeightEntrySchema.index({ user: 1, date: -1 })
WeightEntrySchema.index({ user: 1, date: 1 }, { unique: true })

export default mongoose.models.WeightEntry ||
  mongoose.model('WeightEntry', WeightEntrySchema)
