import mongoose from "mongoose";

/**
 * TaskOccurrence Model
 *
 * Preserves the daily planning and execution truth for a task on a specific date.
 *
 * Solves the historical planning gap where tasks rescheduled across days lost their
 * prior-day state.
 *
 * Example:
 * Sep 29: Task A -> rescheduled to Sep 30 (Sep 29 occurrence marked "rescheduled", rescheduledTo: Sep 30)
 * Sep 30: Task A -> completed (Sep 30 occurrence marked "completed", completedAt: timestamp)
 * Both records persist as historical facts.
 */
const taskOccurrenceSchema = new mongoose.Schema(
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
    productDate: {
      type: String,
      index: true,
    },
    outcome: {
      type: String,
      enum: [
        "pending",
        "completed",
        "partially_completed",
        "rescheduled",
        "missed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    rescheduledTo: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    // Immutable snapshot of task at the time occurrence was created/planned
    // Ensures that even if the underlying Task is later deleted, the historical
    // day plan preserves the original task's title and priority.
    taskSnapshot: {
      title: { type: String, trim: true },
      priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

taskOccurrenceSchema.index({ userId: 1, date: 1 });
taskOccurrenceSchema.index({ userId: 1, taskId: 1, date: 1 }, { unique: true });

export default mongoose.model("TaskOccurrence", taskOccurrenceSchema);
