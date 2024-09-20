import express from 'express';
import { enhancePlayer } from '../controllers/enhancementController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/enhance/:userPlayerId', authMiddleware, enhancePlayer);

export default router;
