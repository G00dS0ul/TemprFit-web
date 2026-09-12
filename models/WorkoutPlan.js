import mongoose from 'mongoose';

const WorkoutPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goal: { type: String, required: true }, // e.g., 'Build Muscle'
    experience: { type: String, required: true }, // e.g., 'Beginner'
    equipment: { type: String, required: true }, // e.g., 'Full Gym'
    days: [
      {
        dayNumber: Number,
        focus: String,
        exercises: [
          {
            name: String,
            sets: Number,
            reps: String,
            rest: String,
            notes: String
          }
        ]
      }
    ],
    isFavorite: { type: Boolean, default: false },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.WorkoutPlan || mongoose.model('WorkoutPlan', WorkoutPlanSchema);
