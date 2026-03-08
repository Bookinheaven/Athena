import mongoose from "mongoose";

const dailyStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    focusMinutes: {
      type: Number,
      default: 0,
    },

    sessions: {
      type: Number,
      default: 0
    },

    dailyTargetMinutes: {
      type: Number,
      required: true,
    },

    streakRate: {
      type: Number,
      required: true,
    },

    state: {
      type: String,
      enum: ["green", "yellow", "red"],
      required: true,
    },

    resultType: {
      type: String,
      enum: ["success", "partial", "failed", "freeze_saved"],
      required: true,
    },

    streakCount: {
      type: Number,
      required: true,
    },

    usedFreeze: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

dailyStatsSchema .index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyStats", dailyStatsSchema );
