import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "",
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
    },

    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      default: null,
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    pinned: {
      type: Boolean,
      default: false,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Note", noteSchema);
