import mongoose from "mongoose";

const streakSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    unique:true,
    required:true
  },

  currentStreak:{ type:Number, default:0 },

  longestStreak:{ type:Number, default:0 },

  lastActiveDate:Date,

  freezeBalance:{ type:Number, default:3 },

  totalFreezesUsed:{ type:Number, default:0 },

  maxFreezeBalance:{ type:Number, default:3 },

  dailyTargetMinutes:{ type:Number, default:25 },

  minTargetMinutes:{ type:Number, default:20 },

  maxTargetMinutes:{ type:Number, default:90 },

  lastTargetReason:{
    type:String,
    enum:["increase_consistency","decrease_burnout","no_change"],
    default:"no_change"
  },

  lastProcessedDate: Date,
  lastCountedDate: Date,

},{ timestamps:true });

export default mongoose.model("Streak",streakSchema);