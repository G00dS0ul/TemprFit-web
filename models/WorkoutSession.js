import mongoose from 'mongoose'

const LoggedSetSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    targetReps: { type: String, default: '' },
    reps: { type: Number, default: null },
    weight: { type: Number, default: 0 },
    restSeconds: { type: Number, default: 60 },
    completed: { type: Boolean, default: false },
    isPR: { type: Boolean, default: false },
    restSecondsActual: { type: Number, default: null },
    notes: { type: String, default: '' },
  },
  { _id: false }
)

const SessionExerciseSchema = new mongoose.Schema(
  {
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    order: { type: Number, default: 0 },
    sets: [LoggedSetSchema],
    replaced: { type: Boolean, default: false }, // true if swapped mid-session from the original plan
    skipped: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { _id: false }
)

const WorkoutSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutTemplate', default: null },
    name: { type: String, default: 'Workout' },
    status: { type: String, enum: ['in-progress', 'completed', 'abandoned'], default: 'in-progress' },
    exercises: [SessionExerciseSchema],
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 }, // sum of weight * reps across all completed sets
    prCount: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

// Historical records should not be overwritten — sessions are append-only
// once `status` moves to 'completed' (enforced at the route level, not here).
WorkoutSessionSchema.index({ user: 1, startedAt: -1 })
WorkoutSessionSchema.index({ user: 1, status: 1 })

export default mongoose.models.WorkoutSession ||
  mongoose.model('WorkoutSession', WorkoutSessionSchema)
