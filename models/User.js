import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    // Primary identity field going forward. Not marked `required` at the
    // schema level (only enforced in the register API route) so accounts
    // created before this field existed don't break on read — see
    // lib/utils.js displayName() for the fallback chain.
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
    },
    name: { type: String, trim: true, default: '' }, // legacy field, kept for pre-username accounts only
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Boolean, default: false },
    password: { type: String, required: true }, // stored as a bcrypt hash, never plain text
    role: {
      type: String,
      enum: ['user', 'trainer', 'admin'],
      default: 'user',
    },
    age: { type: Number, default: null },
    sex: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say', ''],
      default: '',
    },
    heardAboutUs: { type: String, default: '' }, // e.g. "Social Media", "Friend/Family"
    // Flips to true the first time the dashboard renders for this user, so
    // it can show "Welcome to your new dashboard" once and "Welcome back"
    // every time after — flipped server-side so it survives refreshes.
    firstLoginCompleted: { type: Boolean, default: false },
    goal: { type: String, default: '' }, // e.g. "Build Muscle"
    experience: { type: String, default: '' }, // e.g. "Beginner"
    plan: {
      type: String,
      enum: ['free', 'pro', 'elite'],
      default: 'free',
    },
    avatarUrl: { type: String, default: '' }, // data URL (uploaded photo) or an external URL
    favoriteExercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastWorkoutDate: { type: Date, default: null },
    goals: {
      weeklySessions: { type: Number, default: 4 },
      targetExerciseSlug: { type: String, default: 'barbell-bench-press' },
      targetWeight: { type: Number, default: null }, // in the user's weightUnit
      targetBodyFatPercent: { type: Number, default: null },
    },
    weightUnit: { type: String, enum: ['lbs', 'kg'], default: 'lbs' },
    heightCm: { type: Number, default: null }, // canonical storage; UI converts to ft/in or cm for display
  },
  { timestamps: true }
)

// Never send the password hash back in API responses
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

export default mongoose.models.User || mongoose.model('User', UserSchema)
