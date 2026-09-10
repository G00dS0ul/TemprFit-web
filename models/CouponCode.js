import mongoose from 'mongoose';

const CouponCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    planLevel: {
      type: String,
      enum: ['pro', 'max'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null, // null means never expires (for the hardcoded EDSHEERAN codes)
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // admin who generated it
    },
  },
  { timestamps: true }
);

export default mongoose.models.CouponCode || mongoose.model('CouponCode', CouponCodeSchema);
