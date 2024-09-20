import express from 'express';
import { postSignup, postLogin } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

//** 회원가입 */
router.post('/signup', postSignup);

//** 로그인 */
router.post('/login', postLogin, authMiddleware);

export default router;
