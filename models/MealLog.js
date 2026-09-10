import mongoose from 'mongoose'

// One document per logged food entry (not per day) — simplest to query,
// sum, and edit/delete individually. Daily totals are computed on read.
const MealLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    food: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    date: { type: Date, required: true }, // normalized to midnight UTC of the day logged
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      default: 'snack',
    },
    servings: { type: Number, default: 1, min: 0.25 },

    // Snapshot of the macros at log time (servings already applied), so the
    // log stays accurate even if the Food cache entry is later corrected.
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
  { timestamps: true }
)

MealLogSchema.index({ user: 1, date: -1 })

export default mongoose.models.MealLog || mongoose.model('MealLog', MealLogSchema)
