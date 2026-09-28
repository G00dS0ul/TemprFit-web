import mongoose from 'mongoose';

const PodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // lucide icon name
  customImage: { type: String, default: null }, // user uploaded image for pod
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  challenge: {
    targetVolume: { type: Number, default: 50000 },
    currentVolume: { type: Number, default: 0 },
    rewardXP: { type: Number, default: 2500 },
    rewardType: { type: String, enum: ['winner_takes_all', 'shared_pool'], default: 'shared_pool' },
    expiresAt: { type: Date, default: () => {
      const d = new Date();
      d.setDate(d.getDate() + (7 - d.getDay())); // Next Sunday
      return d;
    }}
  }
}, { timestamps: true });

export default mongoose.models.Pod || mongoose.model('Pod', PodSchema);
