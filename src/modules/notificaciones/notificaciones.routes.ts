import { Router } from 'express';
import { AppDataSource } from '../../db/data-source';
import { Notificacion } from './entities/notificacion.entity';

const router = Router();

router.get('/notificaciones', async (req, res, next) => {
  try {
    const usuario_uuid = String(req.query.usuario_uuid);
    const repo = AppDataSource.getRepository(Notificacion);
    const rows = await repo.createQueryBuilder('n')
      .where('n.usuario_uuid = :u', { u: usuario_uuid })
      .orderBy('n.creado_en','DESC')
      .take(50)
      .getMany();
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/notificaciones/:id/leer', async (req, res, next) => {
  try {
    const id = req.params.id;
    await AppDataSource.getRepository(Notificacion).update({ notificacion_uuid: id }, { leida_en: new Date() });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
