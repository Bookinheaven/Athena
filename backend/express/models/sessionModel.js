import mongoose from "mongoose";

const segmentHistorySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["focus", "break"], required: true },
    totalDuration: { type: Number, required: true },
    completedAt: { type: Date, required: true },
    startedAt: { type: Date },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String, 
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  startedAt: { type: Date },
  endedAt: { type: Date },

  isDone: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active",
  },

  userSettings: {
    totalFocusDuration: Number,
    breakDuration: Number,
    autoStartBreaks: Boolean,
    breaksNumber: Number,
  },

  userData: {
    todos: [{ id: String, text: String, status: String, createdAt: Date }],
    notes: [{ id: String , taskId: String, text: String, createdAt: Date }],
  },

  sessionFeedback: {
    mood: { type: Number, min: 1, max: 5 },
    focus: { type: Number, min: 1, max: 5 },
    distractions: String,
  },

  history: {
    type: [segmentHistorySchema],
    default: [],
  },
});

export default mongoose.model("Session", sessionSchema);
