import mongoose from 'mongoose';

const SavedDietPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: 'My Diet Plan',
  },
  content: {
    type: String, // Storing markdown output directly
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.SavedDietPlan || mongoose.model('SavedDietPlan', SavedDietPlanSchema);
