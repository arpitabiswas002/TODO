const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Activity type is required'],
    enum: ['CREATE_TODO', 'UPDATE_STATUS', 'ASSIGN_USER', 'SMART_ASSIGN', 'UPDATE_TITLE', 'UPDATE_DESCRIPTION', 'UPDATE_DUE_DATE', 'DELETE_TODO'],
    comment: 'Type of activity: CREATE_TODO, UPDATE_STATUS, ASSIGN_USER, etc.'
  },
  details: {
    type: String,
    required: [true, 'Activity details are required'],
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Activity must belong to a user']
  },
  todo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Todo',
    required: [true, 'Activity must be associated with a todo']
  },
  oldValue: {
    type: String,
    default: null
  },
  newValue: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Populate user and todo when finding activities
activitySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email'
  }).populate({
    path: 'todo',
    select: 'title'
  });
  next();
});

// Indexes for better query performance
activitySchema.index({ todo: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
