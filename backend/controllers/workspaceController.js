import workspaceService from '../services/workspaceService.js';

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(req.user._id);
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkspace = async (req, res) => {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.user._id, req.params.id);
    res.status(200).json(workspace);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const createWorkspace = async (req, res) => {
  try {
    const workspace = await workspaceService.createWorkspace(req.user._id, req.body);
    res.status(201).json(workspace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateWorkspace = async (req, res) => {
  try {
    const workspace = await workspaceService.updateWorkspace(req.user._id, req.params.id, req.body);
    res.status(200).json(workspace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    await workspaceService.deleteWorkspace(req.user._id, req.params.id);
    res.status(200).json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const addResource = async (req, res) => {
  try {
    const workspace = await workspaceService.addResource(req.user._id, req.params.id, req.body);
    res.status(200).json(workspace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateSession = async (req, res) => {
  try {
    const workspace = await workspaceService.updateSessionContext(req.user._id, req.params.id, req.body);
    res.status(200).json(workspace);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export default {
  getWorkspaces,
  getWorkspace,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addResource,
  updateSession
};
