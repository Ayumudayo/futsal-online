import express from 'express';
import { drawPlayers } from '../controllers/gachaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/draw', authMiddleware, drawPlayers);
// 단일 다중뽑기 합체

export default router;