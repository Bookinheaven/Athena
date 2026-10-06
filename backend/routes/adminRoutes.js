import express from 'express';
import AdminController from '../controllers/adminController.js';
import { registerValidation } from '../middlewares/validation.js';
import adminAuth from '../middlewares/adminMiddleware.js';

const router = express.Router();

// User
router.get('/users', adminAuth, AdminController.getUsers);
router.get('/users/:id', adminAuth, AdminController.getUserDetails);
router.post('/add', adminAuth , AdminController.addUsers);
router.post('/delete', adminAuth , AdminController.removeUsers);
router.post('/update', adminAuth , AdminController.updateUser);

// Sessions
router.get('/userSessions', adminAuth, AdminController.getSessions);

// Developer Data
router.get('/developer-data/datasets', adminAuth, AdminController.getDeveloperDatasets);
router.post('/developer-data/preview', adminAuth, AdminController.previewDeveloperData);
router.post('/developer-data/generate', adminAuth, AdminController.generateDeveloperData);
router.post('/developer-data/add-to-user', adminAuth, AdminController.addDataToUser);
router.delete('/developer-data/datasets/:id', adminAuth, AdminController.deleteDeveloperDataset);

export default router;
