import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import swapRoutes from './routes/swaps';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', swapRoutes); // /swappable-slots, /swap-request, /swap-response/:id

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});
