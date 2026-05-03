const Task = require('../models/Task');

const createTask = async (req, res) => {
  const { title, project, assignedTo, status, dueDate } = req.body;
  if (!title || !project)
    return res.status(400).json({ message: 'Title and project required' });
  const task = await Task.create({ title, project, assignedTo: assignedTo || null, status, dueDate });
  await task.populate('assignedTo', 'name email');
  await task.populate('project', 'name');
  res.status(201).json(task);
};

const getTasks = async (req, res) => {
  const { status, projectId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (projectId) filter.project = projectId;
  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('project', 'name')
    .sort({ dueDate: 1 });
  res.json(tasks);
};

const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const { title, assignedTo, status, dueDate } = req.body;
  if (title)      task.title      = title;
  if (status)     task.status     = status;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

  await task.save();
  await task.populate('assignedTo', 'name email');
  await task.populate('project', 'name');
  res.json(task);
};

const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  await task.deleteOne();
  res.json({ message: 'Task deleted' });
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
