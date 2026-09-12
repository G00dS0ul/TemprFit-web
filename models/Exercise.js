import mongoose from 'mongoose'

// Muscle vocabulary the spec asked for (chest, back, shoulders, biceps,
// triceps, quads, hamstrings, glutes, abdominals), extended with forearms /
// calves / full body so exercises that genuinely target those (grip work,
// calf raises, burpees) have a real value instead of being forced into the
// wrong bucket.
const MUSCLES = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abdominals', 'glutes', 'quads', 'hamstrings', 'calves', 'full body',
]

const ENVIRONMENTS = ['home', 'gym', 'outdoor', 'studio']

// Training-style category. The spec asked for calisthenics / bodybuilding /
// powerlifting / stretching specifically — those are all here — plus the
// rest of the source dataset's own styles (cardio, olympic weightlifting,
// plyometrics, strongman) so those exercises get an honest category instead
// of being mis-filed into the nearest of the four.
const CATEGORIES = [
  'calisthenics', 'bodybuilding', 'powerlifting', 'stretching',
  'cardio', 'olympic weightlifting', 'plyometrics', 'strongman',
]

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']


const SourceSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'TemprFit' },
    url: { type: String, default: '' },
    license: { type: String, default: 'original' },
  },
  { _id: false }
)

const TargetMusclesSchema = new mongoose.Schema(
  {
    primary: { type: String, enum: MUSCLES, required: true },
    secondary: [{ type: String, enum: MUSCLES }],
  },
  { _id: false }
)

const ExerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    instructions: [{ type: String }],

    targetMuscles: { type: TargetMusclesSchema, required: true },
    equipment: [{ type: String }], // barbell, dumbbell, kettlebell, cable machine, machine, resistance band, bodyweight, ...
    category: { type: String, enum: CATEGORIES, required: true }, // training style, NOT muscle group
    movementPattern: { type: String, default: '' },
    difficulty: { type: String, enum: DIFFICULTIES, default: 'beginner' },
    environment: [{ type: String, enum: ENVIRONMENTS }],
    ageSuitability: { type: String, default: 'all' },

    // Deliberately no sets/reps/rest/calorie fields here — those are
    // prescribed dynamically per user + goal by lib/prescription.js (and
    // later the AI planner), not baked into the exercise record.

    trackingType: { 
      type: String, 
      enum: ['weight_reps', 'reps_only', 'time_only'], 
      default: 'weight_reps' 
    },

    media: { type: mongoose.Schema.Types.Mixed },

    safetyNotes: [{ type: String }],
    commonMistakes: [{ type: String }],
    formTips: [{ type: String }],

    variations: [{ type: String }],
    progressions: [{ type: String }],
    regressions: [{ type: String }],
    alternatives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],

    source: { type: SourceSchema, default: () => ({}) },
    publicationStatus: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
  },
  { timestamps: true }
)

ExerciseSchema.index({ name: 'text', description: 'text' })
ExerciseSchema.index({ 'targetMuscles.primary': 1, difficulty: 1 })
ExerciseSchema.index({ category: 1 })
ExerciseSchema.index({ equipment: 1 })
ExerciseSchema.index({ environment: 1 })

export const EXERCISE_MUSCLES = MUSCLES
export const EXERCISE_ENVIRONMENTS = ENVIRONMENTS
export const EXERCISE_CATEGORIES = CATEGORIES
export const EXERCISE_DIFFICULTIES = DIFFICULTIES

export default mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema)
