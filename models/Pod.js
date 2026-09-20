import mongoose from 'mongoose';

const PodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // lucide icon name
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  challenge: {
    targetVolume: { type: Number, default: 50000 },
    currentVolume: { type: Number, default: 0 },
    rewardXP: { type: Number, default: 2500 },
    expiresAt: { type: Date, default: () => {
      const d = new Date();
      d.setDate(d.getDate() + (7 - d.getDay())); // Next Sunday
      return d;
    }}
  }
}, { timestamps: true });

export default mongoose.models.Pod || mongoose.model('Pod', PodSchema);
