import mongoose from 'mongoose'

const PersonalRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutSession', required: true },
    weight: { type: Number, required: true },
    reps: { type: Number, required: true },
    estOneRepMax: { type: Number, required: true }, // Epley: weight * (1 + reps / 30)
    achievedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Historical records should not be overwritten — this collection is append-only.
PersonalRecordSchema.index({ user: 1, exercise: 1, estOneRepMax: -1 })

export default mongoose.models.PersonalRecord ||
  mongoose.model('PersonalRecord', PersonalRecordSchema)
