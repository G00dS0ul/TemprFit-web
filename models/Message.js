import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent'
    },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    isForwarded: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replyTo: {
      messageId: { type: mongoose.Schema.Types.ObjectId },
      senderName: { type: String },
      textSnippet: { type: String }
    }
  },
  { timestamps: true }
);

if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

export default mongoose.model('Message', MessageSchema);
