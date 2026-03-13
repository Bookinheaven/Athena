import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },

    title: {
        type: String,
        enum: ["temporary", "parmanent"],
        default: "temporary",
    },

    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
    },

    estimatedSessions: {
        type: Number,
        default: 0,
    }, 

    completedSessions: {
        type: Number,
        default: 0,
    },

    plannedDate: Date,
    firstSessionAt:Date,
    lastSessionAt: Date,
}, {timestamps: true});

taskSchema.index({ userId:1,status:1 });

export default mongoose.model("Tasks", taskSchema);