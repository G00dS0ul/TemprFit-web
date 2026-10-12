import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  link: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['forum', 'message', 'appointment', 'system', 'subscription', 'plan', 'social', 'general', 'profile_like', 'follow', 'like', 'comment', 'xp_gift'],
    default: 'general',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

if (mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.model('Notification', NotificationSchema);
