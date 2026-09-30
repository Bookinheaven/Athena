import mongoose from "mongoose";

const dailyStatsSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true
  },

  date:{
    type:Date,
    required:true
  },

  productDate:{
    type:String,
    index:true
  },

  focusMinutes:{
    type:Number,
    default:0
  },

  sessions:{
    type:Number,
    default:0
  },

  tasksCompleted:{
    type:Number,
    default:0
  },

  totalPlanned:{
    type:Number,
    default:0
  },

  effectivePlanned:{
    type:Number,
    default:0
  },

  tasksPartiallyCompleted:{
    type:Number,
    default:0
  },

  tasksRescheduled:{
    type:Number,
    default:0
  },

  tasksMissed:{
    type:Number,
    default:0
  },

  tasksCancelled:{
    type:Number,
    default:0
  },

  dailyTargetMinutes:{
    type:Number,
    default:25
  },

  streakRate:{
    type:Number,
    default:0
  },

  completionRate:{
    type:Number,
    default:0
  },

  state:{
    type:String,
    enum:["green","yellow","red","neutral"],
    default:"neutral"
  },

  resultType:{
    type:String,
    enum:["success","partial","failed","neutral","freeze_saved"],
    default:"neutral"
  },

  streakCount:{
    type:Number,
    default:0
  },

  usedFreeze:{
    type:Number,
    default:0
  }

},{ timestamps:true });

dailyStatsSchema.index({ userId:1,date:1 },{ unique:true });

export default mongoose.model("DailyStats",dailyStatsSchema);