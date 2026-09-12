import mongoose from 'mongoose'

const SetPlanSchema = new mongoose.Schema(
  {
    targetReps: { type: String, default: '' }, // e.g. "8-12", "AMRAP", or a number as string
    targetWeight: { type: Number, default: 0 }, // 0 = bodyweight / not weighted
    restSeconds: { type: Number, default: 60 },
    tempo: { type: String, default: '' }, // e.g. "3-1-1-0"
  },
  { _id: false }
)

const WorkoutExerciseSchema = new mongoose.Schema(
  {
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    order: { type: Number, default: 0 },
    sets: [SetPlanSchema],
    notes: { type: String, default: '' },
  },
  { _id: false }
)

const WorkoutTemplateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    goal: { type: String, default: '' }, // strength / hypertrophy / endurance / fat-loss
    exercises: [WorkoutExerciseSchema],
    source: { type: String, enum: ['manual', 'generated'], default: 'manual' },
    isFavorite: { type: Boolean, default: false },
    note: { type: String, default: '' },
    generatorInputs: {
      // only populated when source === 'generated' — kept for transparency/debugging,
      // not shown to the user as a feature
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
)

WorkoutTemplateSchema.index({ user: 1, createdAt: -1 })

export default mongoose.models.WorkoutTemplate ||
  mongoose.model('WorkoutTemplate', WorkoutTemplateSchema)
