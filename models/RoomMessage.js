import mongoose from 'mongoose';

const RoomMessageSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    pinned: { type: Boolean, default: false },
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

if (mongoose.models.RoomMessage) {
  delete mongoose.models.RoomMessage;
}

export default mongoose.model('RoomMessage', RoomMessageSchema);
