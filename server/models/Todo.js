const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter a title for your todo'],
    maxlength: [100, 'Todo title cannot exceed 100 characters'],
    trim: true,
    validate: {
      validator: function(value) {
        return !['Todo', 'In Progress', 'Done'].includes(value);
      },
      message: 'Task title cannot be a column name.'
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },

  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A todo must have a creator']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate for activities
todoSchema.virtual('activities', {
  ref: 'Activity',
  foreignField: 'todo',
  localField: '_id'
});

// Populate user and assignee when finding todos
todoSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'assignee',
    select: 'name email'
  });
  next();
});

module.exports = mongoose.model('Todo', todoSchema);
