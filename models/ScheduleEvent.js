import mongoose from 'mongoose';

const ScheduleEventSchema = new mongoose.Schema(
  {
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['session', 'consultation', 'block'],
      default: 'session',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
    }
  },
  { timestamps: true }
);

ScheduleEventSchema.index({ trainer: 1, startTime: 1 });

export default mongoose.models.ScheduleEvent || mongoose.model('ScheduleEvent', ScheduleEventSchema);
