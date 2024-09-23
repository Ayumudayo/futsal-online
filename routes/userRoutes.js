import express from 'express';
import { buyCash, getUserProfile } from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/buy-cash', authMiddleware, buyCash);
router.get('/profile', authMiddleware, getUserProfile);

export default router;
