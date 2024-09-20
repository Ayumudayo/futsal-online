import express from 'express'
import {rankSort} from '../controllers/userController.js'
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/rank', authMiddleware, rankSort);

export default router;