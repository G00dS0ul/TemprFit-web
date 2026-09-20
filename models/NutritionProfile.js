import mongoose from 'mongoose'

// One profile per user. Drives both the manual food-logging targets and the
// grounding context fed to the AI meal planner (see lib/nutrition-context.js).
const NutritionProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    dietaryPattern: {
      type: String,
      enum: ['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'mediterranean', 'halal', 'kosher'],
      default: 'none',
    },
    allergies: [{ type: String, trim: true }], // free text, e.g. "peanuts", "shellfish"
    exclusions: [{ type: String, trim: true }], // disliked / avoided foods, not allergies
    pantry: [{ type: String, trim: true }], // list of ingredients/foods the user actually has available

    location: { type: String, trim: true, default: '' },
    age: { type: Number, default: null },
    budget: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
    cookingSkill: { type: String, enum: ['beginner', 'intermediate', 'advanced', ''], default: '' },
    cookingTime: { type: String, enum: ['quick', 'moderate', 'extensive', ''], default: '' },

    goal: {
      type: String,
      enum: ['lose_weight', 'maintain', 'gain_muscle', 'improve_health'],
      default: 'maintain',
    },

    // Daily targets. calorieTarget can be user-set or filled in by the AI
    // planner the first time it runs for this profile.
    calorieTarget: { type: Number, default: null },
    proteinTarget: { type: Number, default: null }, // grams
    carbsTarget: { type: Number, default: null }, // grams
    fatTarget: { type: Number, default: null }, // grams

    mealsPerDay: { type: Number, default: 3, min: 1, max: 8 },
  },
  { timestamps: true }
)

export default mongoose.models.NutritionProfile ||
  mongoose.model('NutritionProfile', NutritionProfileSchema)
