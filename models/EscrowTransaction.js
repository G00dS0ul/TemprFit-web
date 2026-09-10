import mongoose from 'mongoose';

const EscrowTransactionSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: true, // The total amount paid by the trainee
    },
    platformFee: {
      type: Number,
      required: true, // The amount taken by the platform (e.g. 15% of amount)
    },
    trainerEarnings: {
      type: Number,
      required: true, // amount - platformFee
    },
    status: {
      type: String,
      enum: ['held', 'released', 'refunded', 'disputed'],
      default: 'held',
    },
    description: {
      type: String, // e.g. "1-on-1 Session booked for Oct 14"
      required: true,
    },
    traineeNotes: {
      type: String,
      default: '', // Goals/messages sent by trainee during booking
    },
    milestones: [
      {
        id: Number,
        label: String,
        percent: Number,
        status: { type: String, enum: ['locked', 'pending', 'completed'], default: 'locked' }
      }
    ],
    releasedAmount: {
      type: Number,
      default: 0, // Track partial releases
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin who resolved the dispute, if any
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.EscrowTransaction || mongoose.model('EscrowTransaction', EscrowTransactionSchema);
