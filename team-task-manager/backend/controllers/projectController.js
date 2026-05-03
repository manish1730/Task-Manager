const Project = require('../models/Project');

const createProject = async (req, res) => {
  const { name, members } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name required' });
  const uniqueMembers = [...new Set([req.user._id.toString(), ...(members || []).map(String)])];
  const project = await Project.create({
    name,
    members: uniqueMembers,
    createdBy: req.user._id,
  });
  await project.populate('members', 'name email role');
  await project.populate('createdBy', 'name email role');
  res.status(201).json(project);
};

const getProjects = async (req, res) => {
  const projects = await Project.find({
    $or: [{ createdBy: req.user._id }, { members: req.user._id }],
  }).populate('members', 'name email role').populate('createdBy', 'name email');
  res.json(projects);
};

const updateProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.createdBy.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Only project creator can update' });

  const { name } = req.body;
  if (name) project.name = name;
  await project.save();
  res.json(project);
};

const deleteProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.createdBy.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Only project creator can delete' });

  await project.deleteOne();
  res.json({ message: 'Project deleted' });
};

const addMember = async (req, res) => {
  const { memberId } = req.body;
  if (!memberId) return res.status(400).json({ message: 'memberId required' });

  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.createdBy.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Only project creator can add members' });

  if (project.members.some((member) => member.toString() === memberId))
    return res.status(400).json({ message: 'User already a member' });

  project.members.push(memberId);
  await project.save();
  await project.populate('members', 'name email role');
  res.json(project);
};

const removeMember = async (req, res) => {
  const { memberId } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.createdBy.toString() !== req.user._id.toString())
    return res.status(403).json({ message: 'Only project creator can remove members' });

  project.members = project.members.filter((m) => m.toString() !== memberId);
  await project.save();
  await project.populate('members', 'name email role');
  res.json(project);
};

module.exports = { createProject, getProjects, updateProject, deleteProject, addMember, removeMember };
