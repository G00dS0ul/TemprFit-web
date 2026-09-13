import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainerProgram',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ trainer: 1, createdAt: -1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
