import express from 'express';
import { playMatch, autoMatch } from '../controllers/matchController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// 순서가 중요
// Express에서 라우트는 여기에 정의된 순서대로 매칭됨
// '/play/:opponentId'가 먼저 와버리면 ':opponentId'를 'automatch'로 인식해버림
// 따라서 /play/automatch'를 '/autoplay'로 수정
router.post('/autoplay', authMiddleware, autoMatch);
router.post('/play', authMiddleware, playMatch);

export default router;
