import mongoose from "mongoose";

const scheduleBlockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "skipped"],
      default: "scheduled",
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

scheduleBlockSchema.index({ userId: 1, date: 1 });
scheduleBlockSchema.index({ taskId: 1, userId: 1 });
scheduleBlockSchema.index({ sessionId: 1, userId: 1 });

export default mongoose.model("ScheduleBlock", scheduleBlockSchema);
