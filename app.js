import express from 'express';
import dotenv from 'dotenv';

import logMiddleware from './middlewares/logMiddleware.js';
import errorHandlingMiddleware from './middlewares/errorHandlingMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';
import enhancementRoutes from './routes/enhancementRoutes.js';
import gachaRoutes from './routes/gachaRoutes.js';

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(logMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/gacha', gachaRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/enhancement', enhancementRoutes);

app.use(errorHandlingMiddleware);

app.get('/', (req, res) => {
  res.send('FUTSAL ONLINE API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
