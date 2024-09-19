import express from 'express';
import { playMatch, autoMatch } from '../controllers/matchController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/play/:opponentId', authMiddleware, playMatch);
router.post('/play/auto-match', authMiddleware, autoMatch);

export default router;