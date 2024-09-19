import express from 'express';
import { createTeam, addPlayer, removePlayer, editTeam, getTeam, getAllTeams } from '../controllers/teamController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createTeam);
router.post('/:teamId/players', authMiddleware, addPlayer);
router.delete('/:teamId/players', authMiddleware, removePlayer);
router.patch('/:teamId/players', authMiddleware, editTeam);
router.get('/:teamId', authMiddleware, getTeam);
router.get('/', authMiddleware, getAllTeams);

export default router;
