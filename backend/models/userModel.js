import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  
  usernameLower: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
    minlength: 8,
  },

  type: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    default: "user",
  },

  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  emailVerificationOTP: String,
  emailVerificationExpires: Date,
  passwordResetOTP: String,
  passwordResetExpires: Date,
  lastLogin: Date,

  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    session: {
      breakDuration: { type: Number, default: 300 },
      autoStartBreaks: { type: Boolean, default: true },
      breaksNumber: { type: Number, default: 4 },
      isSoundEnabled: {type: Boolean, default: false },
      skipBreaks: { type: Boolean, default: true },
      confirmReset: { type: Boolean, default: true },
      soundOnTransition : { type: Boolean, default: false },
    }
  },
},
{
  timestamps: true,
},
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
