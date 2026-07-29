import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['folder', 'file', 'image', 'video', 'pdf', 'url', 'github', 'documentation', 'figma'],
    required: true 
  },
  path: { type: String, required: true }, // Local path or external URL
  isPinned: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now },
});

const taskContextSchema = new mongoose.Schema({
  activeTask: { type: String, default: null },
  pendingTasks: [{ type: String }],
  completedTasks: [{ type: String }],
  deadlines: [{
    title: { type: String },
    date: { type: Date }
  }],
  goals: [{ type: String }],
}, { _id: false });

const sessionContextSchema = new mongoose.Schema({
  totalWorkHours: { type: Number, default: 0 },
  lastSessionDuration: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  deepWorkTime: { type: Number, default: 0 },
  focusSessionsCompleted: { type: Number, default: 0 },
  lastOpened: { type: Date, default: Date.now }
}, { _id: false });

const aiContextSchema = new mongoose.Schema({
  currentObjective: { type: String, default: null },
  suggestedTasks: [{ type: String }],
  recentAccomplishments: [{ type: String }],
  blockers: [{ type: String }],
  aiSummary: { type: String, default: null },
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#7C3AED' }, // default theme color
  icon: { type: String, default: 'folder' },
  category: { type: String, default: 'General' },
  tags: [{ type: String }],
  
  resources: [resourceSchema],
  taskContext: { type: taskContextSchema, default: () => ({}) },
  sessionContext: { type: sessionContextSchema, default: () => ({}) },
  aiContext: { type: aiContextSchema, default: () => ({}) },

  // Terminal state or working directory
  workingDirectory: { type: String, default: null },

}, { timestamps: true });

export default mongoose.model('Workspace', workspaceSchema);
