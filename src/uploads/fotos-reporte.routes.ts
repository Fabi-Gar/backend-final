// src/uploads/fotos-reporte.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mime from 'mime-types';
import { z } from 'zod';

import env from '../config/env';
import { AppDataSource } from '../db/data-source';
import { Reporte } from '../modules/incendios/entities/reporte.entity';
import { FotoReporte } from '../modules/incendios/entities/foto-reporte.entity';

const router = Router();

// Multer en memoria (10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const ParamsSchema = z.object({
  reporte_uuid: z.string().uuid(),
});

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const PUBLIC_BASE = env.MEDIA_BASE_URL ?? `http://localhost:${env.PORT || 4000}`;

async function ensureUploadsDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

// POST /reportes/:reporte_uuid/fotos
router.post(
  '/:reporte_uuid/fotos',
  upload.single('file'), // ¡Multer primero!
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ——— Debug útil ———
      const ct = req.headers['content-type'] || '';
      const bodyKeys = req.body ? Object.keys(req.body) : [];
      const hasFile = !!req.file;
      // eslint-disable-next-line no-console
      console.log('[FOTOS][REQ]', { contentType: ct, bodyKeys, hasFile });

      // Params
      const { reporte_uuid } = ParamsSchema.parse(req.params);

      // Archivo
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Falta el archivo en el campo "file" (form-data).',
            debug: { contentType: ct, bodyKeys, note: 'Usa Postman form-data: key=file tipo File' },
          },
        });
      }

      const { buffer, originalname, mimetype } = req.file;
      if (!/^image\//.test(mimetype || '')) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'El archivo debe ser una imagen (image/*).',
            debug: { mimetype },
          },
        });
      }

      // Body opcional
      const credito =
        typeof req.body?.credito === 'string' && req.body.credito.trim().length
          ? req.body.credito.trim().slice(0, 140)
          : null;

      // Reporte existe
      const repRepo = AppDataSource.getRepository(Reporte);
      const reporte = await repRepo.findOne({ where: { reporte_uuid } });
      if (!reporte) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Reporte no encontrado', debug: { reporte_uuid } },
        });
      }

      // Guardar archivo
      const ext =
        mime.extension(mimetype) ||
        (path.extname(originalname || '').replace('.', '') || 'bin');
      const filename = `${reporte_uuid}-${Date.now()}.${ext}`;

      await ensureUploadsDir();
      await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

      const publicUrl = `${PUBLIC_BASE}/uploads/${filename}`;

      // Guardar en BD
      const fotoRepo = AppDataSource.getRepository(FotoReporte);
      const foto = fotoRepo.create({ reporte, url: publicUrl, credito });
      await fotoRepo.save(foto);

      return res.status(201).json({
        ok: true,
        foto: {
          foto_reporte_uuid: foto.foto_reporte_uuid,
          url: foto.url,
          credito: foto.credito,
          creado_en: foto.creado_en,
        },
      });
    } catch (err: any) {
      // Si llega un ZodError de algún middleware/validator, devuélvelo con contexto
      if (err?.issues) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Validación',
            issues: err.issues,
            debug: {
              where: 'fotos-reporte.routes',
              hint: 'Revisa si algún middleware parsea req.body con Zod cuando Content-Type es multipart/form-data',
            },
          },
        });
      }
      return next(err);
    }
  }
);

// GET /reportes/:reporte_uuid/fotos
router.get(
  '/:reporte_uuid/fotos',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reporte_uuid } = ParamsSchema.parse(req.params);
      const fotoRepo = AppDataSource.getRepository(FotoReporte);
      const items = await fotoRepo.find({
        where: { reporte: { reporte_uuid } },
        order: { creado_en: 'DESC' },
        relations: { reporte: true },
      });
      res.json({
        items: items.map((f) => ({
          foto_reporte_uuid: f.foto_reporte_uuid,
          url: f.url,
          credito: f.credito,
          creado_en: f.creado_en,
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
