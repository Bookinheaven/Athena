import express from 'express';
import AdminController from '../controllers/adminController.js';
import { registerValidation } from '../middlewares/validation.js';
import adminAuth from '../middlewares/adminMiddleware.js';

const router = express.Router();

// User
router.get('/users', adminAuth, AdminController.getUsers);
router.post('/add', adminAuth , AdminController.addUsers);
router.post('/delete', adminAuth , AdminController.removeUsers);
router.post('/update', adminAuth , AdminController.updateUser);

// Sessions
router.get('/userSessions', adminAuth, AdminController.getSessions);


export default router;
