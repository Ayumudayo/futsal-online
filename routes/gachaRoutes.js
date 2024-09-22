import express from 'express';
import { pull, multiPull } from '../controllers/gachaController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// 단일 뽑기
router.post('/pull', authMiddleware, pull);

// 다중 뽑기
router.post('/:times/multipull', authMiddleware, multiPull);

export default router;