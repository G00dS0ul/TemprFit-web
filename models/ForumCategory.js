import mongoose from 'mongoose'

const ForumCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true }, // e.g. "MessageSquare", "Flame", "Apple"
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.ForumCategory || mongoose.model('ForumCategory', ForumCategorySchema)
