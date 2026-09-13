import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainerProgram',
      required: true,
    },
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
    amountPaid: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'disputed', 'cancelled'],
      default: 'pending',
    },
    escrowStatus: {
      type: String,
      enum: ['held', 'partially_released', 'released', 'refunded'],
      default: 'held',
    },
    totalSessions: {
      type: Number,
      required: true,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    paymentRef: {
      type: String, // Flutterwave transaction reference
    },
  },
  { timestamps: true }
);

BookingSchema.index({ trainer: 1, status: 1 });
BookingSchema.index({ trainee: 1, status: 1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
