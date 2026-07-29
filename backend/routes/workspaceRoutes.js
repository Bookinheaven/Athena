import express from 'express';
import workspaceController from '../controllers/workspaceController.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(auth);

// Get all workspaces for the logged in user
router.get('/', workspaceController.getWorkspaces);

// Create a new workspace
router.post('/', workspaceController.createWorkspace);

// Get a specific workspace
router.get('/:id', workspaceController.getWorkspace);

// Update a specific workspace
router.patch('/:id', workspaceController.updateWorkspace);

// Delete a specific workspace
router.delete('/:id', workspaceController.deleteWorkspace);

// Add a resource to a workspace
router.post('/:id/resources', workspaceController.addResource);

// Update session context (used for autosave during a session)
router.patch('/:id/session', workspaceController.updateSession);

export default router;
