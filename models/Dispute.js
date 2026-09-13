import mongoose from 'mongoose';

const DisputeSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'closed'],
      default: 'open',
    },
    resolution: {
      type: String,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

DisputeSchema.index({ booking: 1 });
DisputeSchema.index({ status: 1 });

export default mongoose.models.Dispute || mongoose.model('Dispute', DisputeSchema);
