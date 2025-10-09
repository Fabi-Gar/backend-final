import { Router } from 'express';
import { runFirmsIngest } from './services/firms.service';
import { AppDataSource } from '../../db/data-source';
import { JobRun } from '../jobs/entities/job-run.entity';
import { AuditoriaEventos } from '../auditoria/entities/auditoria-eventos.entity';
import { ensureFirmsCron } from './firms.queue';

const router = Router();

router.post('/run', async (_req, res, next) => {
  try {
    const r = await runFirmsIngest();
    res.json(r);
  } catch (e) { next(e); }
});

router.get('/job-runs', async (req, res, next) => {
  try {
    const take = Math.min(parseInt(String(req.query.take || 20)), 100);
    const repo = AppDataSource.getRepository(JobRun);
    const rows = await repo.createQueryBuilder('j')
      .orderBy('j.inicio','DESC')
      .take(take)
      .getMany();
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/incendios/:id/feed', async (req, res, next) => {
  try {
    const id = req.params.id;
    const take = Math.min(parseInt(String(req.query.take || 50)), 200);
    const repo = AppDataSource.getRepository(AuditoriaEventos);
    const rows = await repo.createQueryBuilder('a')
      .where('a.entidad = :ent AND a.entidad_uuid = :id', { ent: 'incendios', id })
      .orderBy('a.creado_en','DESC')
      .take(take)
      .getMany();
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/sse', async (req, res) => {
  res.setHeader('Content-Type','text/event-stream');
  res.setHeader('Cache-Control','no-cache');
  res.setHeader('Connection','keep-alive');
  const hb = setInterval(() => res.write(`event: ping\ndata: {}\n\n`), parseInt(process.env.SSE_HEARTBEAT_MS || '15000'));
  req.on('close', () => clearInterval(hb));
});

router.post('/schedule', async (_req, res, next) => {
  try {
    const next = await ensureFirmsCron();
    res.json({ ok: true, next });
  } catch (e) { next(e); }
});

export default router;
