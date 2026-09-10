import mongoose from 'mongoose';

const TagSchema = new mongoose.Schema({
  bodyPart: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
});

const TransformationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  baseImage: {
    type: String,
    required: true,
  },
  newImage: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male',
  },
  baseTags: [TagSchema],
  newTags: [TagSchema],
  aiFeedback: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Transformation || mongoose.model('Transformation', TransformationSchema);
