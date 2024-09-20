import express from 'express';
import { drawPlayer } from '../controllers/gachaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

//router.post('/draw', authMiddleware, drawPlayer);

export default router;
