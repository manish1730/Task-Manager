const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: '',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Task must belong to a project'],
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  status: {
    type: String,
    enum: { values: ['Todo', 'In Progress', 'Done'], message: 'Invalid status value' },
    default: 'Todo',
  },
  priority: {
    type: String,
    enum: { values: ['Low', 'Medium', 'High'], message: 'Invalid priority value' },
    default: 'Medium',
  },
  dueDate: {
    type: Date,
    default: null,
  },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual — true if past due date and not done
taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'Done') return false;
  return new Date(this.dueDate) < new Date();
});

// Index for faster filtering by status and project
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Task', taskSchema);
