import express from 'express';
import { GachaSystem } from '../models/GachaSystem.js';

const router = express.Router();
const gacha = new GachaSystem();

router.get('/pull', (req, res) => {
    const result = gacha.pull();
    res.json(result);
});

router.get('/multipull/:times', (req, res) => {
    const times = parseInt(req.params.times);
    const results = gacha.multiPull(times);
    res.json(results);
});

export default router;
