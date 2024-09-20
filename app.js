import express from 'express';
import dotenv from 'dotenv';

import logMiddleware from './middlewares/logMiddleware.js';
import errorHandlingMiddleware from './middlewares/errorHandlingMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import userRoutes from './routes/userRoutes.js'

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(logMiddleware);

app.use('/api/auth', authRoutes);
// 사용자 API 라우트
// 가챠 API 라우트
app.use('/api/teams', teamRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/user', userRoutes);

app.use(errorHandlingMiddleware);

app.get('/', (req, res) => {
  res.send('FUTSAL ONLINE API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
