import express from 'express';
import {
  createTeam,
  addPlayer,
  removePlayer,
  editTeam,
  getTeam,
  getAllTeams,
} from '../controllers/teamController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createTeam);
router.post('/:teamId/addPlayers', authMiddleware, addPlayer);
router.delete('/:teamId/rmPlayers', authMiddleware, removePlayer);
router.patch('/:teamId/editTeam', authMiddleware, editTeam);
router.get('/:teamId', authMiddleware, getTeam);
router.get('/', authMiddleware, getAllTeams);

export default router;
