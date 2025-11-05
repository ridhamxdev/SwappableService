import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

function parseDateOrNull(v: unknown): Date | null {
  if (typeof v === 'number') {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d; // epoch millis
  }
  if (typeof v === 'string') {
    const d = new Date(v);                // ISO like "2025-11-05T08:00:00Z"
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

router.get('/', async (req, res) => {
  const userId = req.user!.userId;
  const events = await prisma.event.findMany({ where: { userId }, orderBy: { startTime: 'asc' } });
  res.json(events);
});

router.post('/', async (req, res) => {
  const userId = req.user!.userId;
  const { title, startTime, endTime, status } = req.body ?? {};
  if (!title) return res.status(400).json({ error: 'title is required' });

  const start = parseDateOrNull(startTime);
  const end = parseDateOrNull(endTime);
  if (!start || !end) return res.status(400).json({ error: 'startTime and endTime must be valid dates (ISO or millis)' });
  if (end <= start) return res.status(400).json({ error: 'endTime must be after startTime' });

  const safeStatus = (status === 'SWAPPABLE' || status === 'BUSY') ? status : 'BUSY';

  const event = await prisma.event.create({
    data: { title, startTime: start, endTime: end, status: safeStatus, userId }
  });
  res.status(201).json(event);
});

router.put('/:id', async (req, res) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const existing = await prisma.event.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { title, startTime, endTime, status } = req.body ?? {};

  const start = startTime !== undefined ? parseDateOrNull(startTime) : existing.startTime;
  const end = endTime !== undefined ? parseDateOrNull(endTime) : existing.endTime;

  if (startTime !== undefined && !start) return res.status(400).json({ error: 'startTime is invalid' });
  if (endTime !== undefined && !end) return res.status(400).json({ error: 'endTime is invalid' });
  if (end <= start) return res.status(400).json({ error: 'endTime must be after startTime' });

  const safeStatus = (status === 'SWAPPABLE' || status === 'BUSY' || status === 'SWAP_PENDING')
    ? status
    : existing.status;

  const updated = await prisma.event.update({
    where: { id },
    data: { title: title ?? existing.title, startTime: start, endTime: end, status: safeStatus }
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  const existing = await prisma.event.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await prisma.event.delete({ where: { id } });
  res.status(204).send();
});

export default router;
