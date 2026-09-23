import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  email: { type: String, required: false }, // For appeals where the user might not be fully authenticated
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  adminReply: { type: String },
  type: { type: String, enum: ['support', 'appeal'], default: 'support' }
}, {
  timestamps: true
});

export default mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
