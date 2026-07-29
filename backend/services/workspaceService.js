import Workspace from '../models/workspaceModel.js';

/**
 * Get all workspaces for a user
 */
const getUserWorkspaces = async (userId) => {
  return await Workspace.find({ user: userId }).sort({ 'sessionContext.lastOpened': -1 });
};

/**
 * Get a single workspace by ID
 */
const getWorkspaceById = async (userId, workspaceId) => {
  const workspace = await Workspace.findOne({ _id: workspaceId, user: userId });
  if (!workspace) throw new Error('Workspace not found');
  
  // Update last opened
  workspace.sessionContext.lastOpened = new Date();
  await workspace.save();
  
  return workspace;
};

/**
 * Create a new workspace
 */
const createWorkspace = async (userId, data) => {
  const workspace = new Workspace({
    ...data,
    user: userId
  });
  return await workspace.save();
};

/**
 * Update an existing workspace
 */
const updateWorkspace = async (userId, workspaceId, data) => {
  const workspace = await Workspace.findOneAndUpdate(
    { _id: workspaceId, user: userId },
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!workspace) throw new Error('Workspace not found');
  return workspace;
};

/**
 * Delete a workspace
 */
const deleteWorkspace = async (userId, workspaceId) => {
  const workspace = await Workspace.findOneAndDelete({ _id: workspaceId, user: userId });
  if (!workspace) throw new Error('Workspace not found');
  return workspace;
};

/**
 * Add a resource to a workspace
 */
const addResource = async (userId, workspaceId, resourceData) => {
  const workspace = await Workspace.findOne({ _id: workspaceId, user: userId });
  if (!workspace) throw new Error('Workspace not found');

  workspace.resources.push(resourceData);
  await workspace.save();
  return workspace;
};

/**
 * Update session context (used when closing a workspace or saving session)
 */
const updateSessionContext = async (userId, workspaceId, sessionData) => {
  const workspace = await Workspace.findOne({ _id: workspaceId, user: userId });
  if (!workspace) throw new Error('Workspace not found');

  workspace.sessionContext = {
    ...workspace.sessionContext.toObject(),
    ...sessionData
  };
  await workspace.save();
  return workspace;
};

export default {
  getUserWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addResource,
  updateSessionContext
};
