import mongoose from 'mongoose'

const ContractSchema = new mongoose.Schema(
  {
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
    termsType: { 
      type: String, 
      enum: ['trainer_trainee_service', 'trainer_revenue_share', 'general_tos', 'health_disclaimer'],
      required: true
    },
    termsVersion: { type: String, required: true },
    signedAt: { type: Date, default: Date.now },
    signerIp: { type: String },
    signatureData: { type: String, required: true }, // Base64 signature canvas data URL or legal typed name
    status: { 
      type: String, 
      enum: ['pending', 'active', 'revoked', 'expired'],
      default: 'active'
    },
    agreedToCommission: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.models.Contract || mongoose.model('Contract', ContractSchema)
