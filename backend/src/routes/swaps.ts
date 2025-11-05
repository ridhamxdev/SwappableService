import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/swappable-slots', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const slots = await prisma.event.findMany({
    where: { status: 'SWAPPABLE', NOT: { userId } },
    orderBy: { startTime: 'asc' },
    include: { owner: { select: { id: true, name: true, email: true } } }
  });
  res.json(slots);
});

router.post('/swap-request', async (req: Request, res: Response) => {
  const requesterId = req.user!.userId;
  const { mySlotId, theirSlotId } = req.body as { mySlotId?: number; theirSlotId?: number };
  if (!mySlotId || !theirSlotId) return res.status(400).json({ error: 'Missing slot ids' });

  const mySlot = await prisma.event.findFirst({ where: { id: mySlotId, userId: requesterId } });
  const theirSlot = await prisma.event.findUnique({ where: { id: theirSlotId } });
  if (!mySlot || !theirSlot) return res.status(400).json({ error: 'Invalid slots' });
  if (mySlot.status !== 'SWAPPABLE' || theirSlot.status !== 'SWAPPABLE') {
    return res.status(400).json({ error: 'Slots not swappable' });
  }
  if (theirSlot.userId === requesterId) return res.status(400).json({ error: 'Cannot swap with yourself' });

  const swap = await prisma.$transaction(async (tx) => {
    const created = await tx.swapRequest.create({
      data: {
        mySlotId,
        theirSlotId,
        requesterId,
        responderId: theirSlot.userId,
        status: 'PENDING'
      }
    });
    await tx.event.update({ where: { id: mySlotId }, data: { status: 'SWAP_PENDING' } });
    await tx.event.update({ where: { id: theirSlotId }, data: { status: 'SWAP_PENDING' } });
    return created;
  });

  res.status(201).json(swap);
});

router.post('/swap-response/:requestId', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const requestId = parseInt(req.params.requestId, 10);
  const { accept } = req.body as { accept: boolean };

  const sr = await prisma.swapRequest.findUnique({ where: { id: requestId } });
  if (!sr) return res.status(404).json({ error: 'Not found' });
  if (sr.responderId !== userId) return res.status(403).json({ error: 'Not your request to respond' });
  if (sr.status !== 'PENDING') return res.status(400).json({ error: 'Request not pending' });

  if (!accept) {
    await prisma.$transaction(async (tx) => {
      await tx.swapRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
      await tx.event.update({ where: { id: sr.mySlotId }, data: { status: 'SWAPPABLE' } });
      await tx.event.update({ where: { id: sr.theirSlotId }, data: { status: 'SWAPPABLE' } });
    });
    return res.json({ ok: true, status: 'REJECTED' });
  }

  await prisma.$transaction(async (tx) => {
    const mySlot = await tx.event.findUnique({ where: { id: sr.mySlotId } });
    const theirSlot = await tx.event.findUnique({ where: { id: sr.theirSlotId } });
    if (!mySlot || !theirSlot) throw new Error('Slots disappeared');
    if (mySlot.status !== 'SWAP_PENDING' || theirSlot.status !== 'SWAP_PENDING') {
      throw new Error('Slots not pending');
    }
    await tx.event.update({ where: { id: mySlot.id }, data: { userId: sr.responderId, status: 'BUSY' } });
    await tx.event.update({ where: { id: theirSlot.id }, data: { userId: sr.requesterId, status: 'BUSY' } });
    await tx.swapRequest.update({ where: { id: requestId }, data: { status: 'ACCEPTED' } });
  });

  res.json({ ok: true, status: 'ACCEPTED' });
});

router.get('/requests', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const incoming = await prisma.swapRequest.findMany({
    where: { responderId: userId },
    orderBy: { createdAt: 'desc' },
    include: { mySlot: true, theirSlot: true }
  });
  const outgoing = await prisma.swapRequest.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: 'desc' },
    include: { mySlot: true, theirSlot: true }
  });
  res.json({ incoming, outgoing });
});

export default router;
