import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({

  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true,
    index:true
  },

  text:{
    type:String,
    required:true
  },

  type:{
    type:String,
    enum:["session","knowledge","task"],
    default:"session"
  },

  sourceSessionId:{
    type:String,
    default:null
  },

  taskId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Tasks",
    default:null
  }

},{ timestamps:true });

export default mongoose.model("Notes",noteSchema);