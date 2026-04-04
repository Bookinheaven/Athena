import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
      index: true,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    color: {
      type: String,
      default: "#6366f1",
    },

    dueDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Goal", goalSchema);