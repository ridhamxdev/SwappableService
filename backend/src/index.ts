import express, { Request, Response } from 'express';
import { PORT } from './config';
import { corsMiddleware, getAllowedOrigins, refreshAllowedOrigins } from './utils/cors';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import swapRoutes from './routes/swaps';

const app = express();

// CORS first
refreshAllowedOrigins();
console.log('CORS allowed origins:', getAllowedOrigins());
app.use(corsMiddleware());
// Handle explicit preflight (optional; cors() already does this)
app.options('*', corsMiddleware());

app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', swapRoutes);

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});
