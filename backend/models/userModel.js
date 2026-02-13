import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  type: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    default: "user"
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  streak: {
    dailyTargetMinutes: { type: Number, default: 25 },
    
    freezeBalance: { type: Number, default: 1 },
    maxFreezeBalance: { type: Number, default: 3 },
    
    minTargetMinutes: { type: Number, default: 20 },
    maxTargetMinutes: { type: Number, default: 90 },
    lastTargetReason: { 
        type: String,
        enum: ["increase_consistency", "decrease_burnout", "no_change"],
        default: "no_change"
    },
  
    dailyStreak: { type: Number, default: 0 },
    lastProcessedDate: Date
  },
  emailVerificationOTP: String,
  emailVerificationExpires: Date,
  passwordResetOTP: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
