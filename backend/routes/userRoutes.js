import express from 'express';
import auth from '../middlewares/authMiddleware.js';
import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/settings', auth, userController.getSettings);
router.patch('/settings/{/:type}', auth, userController.updateSettings);
router.post('/settings/{/:type}/reset', auth, userController.resetSettings);


export default router;
