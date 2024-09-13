import express from 'express';
import dotenv from 'dotenv';

import logMiddleware from './middlewares/logMiddleware.js';
import errorHandlingMiddleware from './middlewares/errorHandlingMiddleware.js';

import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(logMiddleware);

app.use('/api/auth', authRoutes);

app.use(errorHandlingMiddleware);

app.get('/', (req, res) => {
  res.send('FUTSAL ONLINE API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
