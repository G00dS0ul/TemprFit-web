import mongoose from 'mongoose'

// A single meal in a generated plan day. Kept lightweight/free-text for the
// meal itself (name + macros) rather than forcing every AI suggestion to
// resolve to a real Food doc — food swaps happen against this structure.
const PlannedMealSchema = new mongoose.Schema(
  {
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    imageUrl: { type: String, default: '' },
  },
  { _id: false }
)

const PlanDaySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true }, // 1-7
    meals: [PlannedMealSchema],
  },
  { _id: false }
)

const MealPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    days: [PlanDaySchema],
    shoppingList: [{ type: String }],
    // The exact grounding context sent to Gemini, kept for debugging/audit —
    // never shown to the user, mirrors nothing sensitive beyond their own data.
    generatedFrom: { type: String, default: '' },
    active: { type: Boolean, default: true }, // only the newest plan per user is active
  },
  { timestamps: true }
)

MealPlanSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.MealPlan || mongoose.model('MealPlan', MealPlanSchema)
