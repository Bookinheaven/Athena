import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
{
  type: {
    type: String,
    enum: [
      "focus_start",
      "focus_complete",
      "break_start",
      "break_complete",
      "pause",
      "resume",
      "session_end"
    ],
    required: true
  },

  timestamp: {
    type: Date,
    default: Date.now
  },

  segmentIndex: {
    type: Number
  }

},
{ _id: false }
);


const segmentsSchema = new mongoose.Schema(
{
  type: {
    type: String,
    enum: ["focus", "break"],
    required: true
  },

  duration: { type: Number, default: 0 },
  totalDuration: { type: Number, required: true },

  startedAt: { type: Date, default: null },

  startTimestamp: { type: Date },

  completedAt: { type: Date },

},
{ _id: false }
);

const sessionSchema = new mongoose.Schema({

  sessionId: {
    type: String,
    required: true,
    index: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    default: null
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  sessionType: {
    type: String,
    enum: ["task", "quick"],
    default: "quick"
  },

  startedAt: Date,
  endedAt: Date,

  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active"
  },

  completionType: {
    type: String,
    enum: ["completed", "skipped", "abandoned"],
    default: null
  },

  duration: { type: Number, default: 0 },

  totalFocusMinutes: { type: Number, default: 0 },
  totalBreakMinutes: { type: Number, default: 0 },

  sessionStats: {
    pauseCount: { type: Number, default: 0 },
    totalPauseDuration: { type: Number, default: 0 },
    focusSegmentsCompleted: { type: Number, default: 0 },
    breakSegmentsCompleted: { type: Number, default: 0 },
    interruptions: { type: Number, default: 0 }
  },

  // events: {
  //   type: [eventSchema],
  //   default: []
  // },

  plannedDuration: {
    type: Number,
    default: 0
  },
 
  sessionFeedback: {
    mood: { type: Number, min: 1, max: 5 },
    focus: { type: Number, min: 1, max: 5 },
    distractions: String,
    submittedAt: Date
  },

  sessionSegments: {
    type: [segmentsSchema],
    default: []
  }

},
{ timestamps: true });

sessionSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
sessionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Session", sessionSchema);