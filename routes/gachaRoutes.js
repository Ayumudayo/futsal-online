import express from 'express';
import { drawPlayers } from '../controllers/gachaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/draw', authMiddleware, drawPlayers);

export default router;
