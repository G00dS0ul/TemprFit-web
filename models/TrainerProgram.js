import mongoose from 'mongoose';

const TrainerProgramSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    programProfilePicture: {
      type: String,
      required: false,
    },
    category: {
      type: String,
      enum: ['General Fitness', 'Hypertrophy', 'Strength', 'Endurance', 'Flexibility', 'Weight Loss', 'Athletic Performance', 'Rehabilitation'],
      default: 'General Fitness',
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    sessionsPerWeek: {
      type: Number,
      required: true,
      min: 1,
    },
    totalSessions: {
      type: Number,
      required: true,
      min: 1,
    },
    freeSessions: {
      type: Number,
      default: 0,
    },
    trainingMode: {
      type: String,
      enum: ['physical', 'remote', 'hybrid'],
      default: 'remote',
    },
    language: {
      type: String,
      default: 'English',
    },
    country: {
      type: String,
      default: 'Global',
    },
    mediaGallery: [{
      type: String,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    requirements: [{
      type: String,
    }],
    targetAudience: {
      type: String,
      default: 'Everyone',
    },
    faq: [{
      question: { type: String, required: true },
      answer: { type: String, required: true }
    }],
    // Keep track of how many users have booked this program
    bookingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Add index for fast searches
TrainerProgramSchema.index({ trainer: 1, isActive: 1 });
TrainerProgramSchema.index({ category: 1, trainingMode: 1 });

export default mongoose.models.TrainerProgram || mongoose.model('TrainerProgram', TrainerProgramSchema);
