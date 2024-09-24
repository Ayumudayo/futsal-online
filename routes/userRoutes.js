import express from 'express';
import { buyCash, getUserProfile, getAllPlayer } from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/buy-cash', authMiddleware, buyCash);
router.get('/profile', authMiddleware, getUserProfile);
router.get('/player', authMiddleware, getAllPlayer);

export default router;
