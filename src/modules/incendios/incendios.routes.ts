// src/modules/incendios/incendios.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../db/data-source'
import { Incendio } from './entities/incendio.entity'
import { Usuario } from '../seguridad/entities/usuario.entity'
import { FindOptionsWhere, ILike, IsNull, Between } from 'typeorm'
import { guardAuth, guardAdmin } from '../../middlewares/auth'
import { auditRecord } from '../auditoria/auditoria.service'
import { EstadoIncendio } from '../catalogos/entities/estado-incendio.entity'
import { IncendioEstadoHistorial } from './entities/incendio-estado-historial.entity'

const router = Router()



// --- helpers ---
const point4326 = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
})


type PgErrorMapped = { status: number; body: Record<string, any> } | null;

const mapPgError = (err: any): PgErrorMapped => {
  // FK violation
  if (err?.code === '23503') {
    return {
      status: 400,
      body: { code: 'FK_VIOLATION', detail: err?.detail, constraint: err?.constraint }
    };
  }
  // NOT NULL
  if (err?.code === '23502') {
    return {
      status: 400,
      body: { code: 'NOT_NULL_VIOLATION', column: err?.column, table: err?.table }
    };
  }
  // UNIQUE
  if (err?.code === '23505') {
    return {
      status: 409,
      body: { code: 'UNIQUE_VIOLATION', detail: err?.detail, constraint: err?.constraint }
    };
  }
  return null;
};


// helper para default:
async function getDefaultEstadoUuid() {
  const repo = AppDataSource.getRepository(EstadoIncendio)
  // 1) intenta por codigo 'REPORTADO'
  const byCode = await repo.createQueryBuilder('e')
    .where('e.eliminado_en IS NULL AND e.codigo = :c', { c: 'REPORTADO' })
    .getOne()
  if (byCode) return (byCode as any).estado_incendio_uuid

  // 2) cae al de menor orden
  const byOrden = await repo.createQueryBuilder('e')
    .where('e.eliminado_en IS NULL')
    .orderBy('e.orden', 'ASC')
    .getOne()
  if (byOrden) return (byOrden as any).estado_incendio_uuid

  return null
}

const createIncendioSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().nullish(),
  centroide: point4326.nullish(),
  estado_incendio_uuid: z.string().uuid().optional(), // server pone default si no viene
})


const createIncendioWithReporteSchema = z.object({
  // campos del incendio
  titulo: z.string().min(1),
  descripcion: z.string().nullish(),
  centroide: point4326.nullish(),
  estado_incendio_uuid: z.string().uuid().optional(),

  // bloque del reporte (obligatorio)
  reporte: z.object({
    institucion_uuid: z.string().uuid().optional().nullable(), // se completa con el perfil si no viene
    medio_uuid: z.string().uuid(),
    ubicacion: point4326.nullish(), // si no viene, usamos el centroide del incendio
    reportado_en: z.coerce.date().optional(),
    observaciones: z.string().optional().nullable(),
    telefono: z.string().optional().nullable(),
    departamento_uuid: z.string().uuid().optional().nullable(),
    municipio_uuid: z.string().uuid().optional().nullable(),
    lugar_poblado: z.string().optional().nullable(),
    finca: z.string().optional().nullable(),
  }),
})

// ⚠️ Importante: NO permitir null; si permites null aquí, romperás el NOT NULL en DB.
const updateIncendioSchema = z.object({
  titulo: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  centroide: point4326.nullish().optional(),
  estado_incendio_uuid: z.string().uuid().optional(), // <-- sin nullish
})

router.get('/sin-aprobar', guardAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '50'), 10) || 50, 1), 200);

    // Total
    const totalRows = await AppDataSource.query(
      `
      SELECT COUNT(*)::int AS total
      FROM incendios i
      WHERE i.eliminado_en IS NULL
        AND i.aprobado = FALSE
        AND ($1 = '' OR i.titulo ILIKE '%' || $1 || '%')
      `,
      [q]
    );
    const total = totalRows?.[0]?.total ?? 0;

    // Items (sin JOIN a regiones; región derivada de último reporte)
    const items = await AppDataSource.query(
      `
      SELECT
        i.incendio_uuid,
        i.titulo,
        i.descripcion,
        i.centroide,
        i.creado_en,
        i.requiere_aprobacion,
        jsonb_build_object(
          'usuario_uuid', u.usuario_uuid,
          'nombre', u.nombre,
          'apellido', u.apellido,
          'email', u.email
        ) AS creado_por,
        CASE
          WHEN lr.depto_nombre IS NOT NULL OR lr.muni_nombre IS NOT NULL THEN
            jsonb_build_object(
              'region_uuid', NULL,
              'nombre',
              trim(
                COALESCE(lr.depto_nombre,'') ||
                CASE WHEN lr.depto_nombre IS NOT NULL AND lr.muni_nombre IS NOT NULL THEN ' / ' ELSE '' END ||
                COALESCE(lr.muni_nombre,'')
              )
            )
          ELSE NULL
        END AS region,
        CASE WHEN lr.reportado_en IS NULL THEN NULL ELSE
          jsonb_build_object(
            'reportado_por_nombre', lr.reportado_por_nombre,
            'reportado_en', lr.reportado_en,
            'telefono', lr.telefono
          )
        END AS ultimo_reporte
      FROM incendios i
      LEFT JOIN usuarios u ON u.usuario_uuid = i.creado_por_uuid
      LEFT JOIN LATERAL (
        SELECT
          r.reportado_por_nombre,
          r.reportado_en,
          r.telefono,
          d.nombre AS depto_nombre,
          m.nombre AS muni_nombre
        FROM reportes r
        LEFT JOIN departamentos d ON d.departamento_uuid = r.departamento_uuid
        LEFT JOIN municipios   m ON m.municipio_uuid   = r.municipio_uuid
        WHERE r.eliminado_en IS NULL
          AND r.incendio_uuid = i.incendio_uuid
        ORDER BY r.reportado_en DESC NULLS LAST, r.creado_en DESC
        LIMIT 1
      ) lr ON TRUE
      WHERE i.eliminado_en IS NULL
        AND i.aprobado = FALSE
        AND ($1 = '' OR i.titulo ILIKE '%' || $1 || '%')
      ORDER BY i.creado_en DESC
      LIMIT $2 OFFSET $3
      `,
      [q, pageSize, (page - 1) * pageSize]
    );

    res.json({ total, page, pageSize, items });
  } catch (err) { next(err); }
});


// -------------------- LISTAR --------------------
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    const desde = req.query.desde ? new Date(String(req.query.desde)) : undefined
    const hasta = req.query.hasta ? new Date(String(req.query.hasta)) : undefined

    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '20'), 10) || 20, 1), 100)

    const where: FindOptionsWhere<Incendio> = { eliminado_en: IsNull(), aprobado: true }
    if (q) (where as any).titulo = ILike(`%${q}%`)
    if (desde && hasta) (where as any).creado_en = Between(desde, hasta)

    const repo = AppDataSource.getRepository(Incendio)
    const [items, total] = await repo.findAndCount({
      where,
      order: { creado_en: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize
    })

    res.json({ total, page, pageSize, items })
  } catch (err) { next(err) }
})

// -------------------- DETALLE --------------------
router.get('/:uuid', async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const repo = AppDataSource.getRepository(Incendio)
    const item = await repo.findOne({
      where: { incendio_uuid: uuid, eliminado_en: IsNull() },
      relations: { creado_por: true }
    })
    const u = res.locals?.ctx?.user
    const puedeVer = item && (item.aprobado || (u?.is_admin || u?.usuario_uuid === (item as any).creado_por_uuid))
    if (!item || !puedeVer) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no disponible' }, requestId: res.locals.ctx?.requestId })
    }
    res.json(item)
  } catch (err) { next(err) }
})

// -------------------- CREAR (incendio + primer reporte) --------------------
// POST /incendios/with-reporte
const incendioFields = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().nullish(),
  centroide: point4326.nullish(),
  estado_incendio_uuid: z.string().uuid().optional(),
});

const reporteFields = z.object({
  institucion_uuid: z.string().uuid().optional().nullable(),
  medio_uuid: z.string().uuid(),
  ubicacion: point4326.nullish(),
  reportado_en: z.coerce.date().optional(),
  observaciones: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  departamento_uuid: z.string().uuid().optional().nullable(),
  municipio_uuid: z.string().uuid().optional().nullable(),
  lugar_poblado: z.string().optional().nullable(),
  finca: z.string().optional().nullable(),
});

// 2) Dos esquemas válidos
const schemaPlano = incendioFields.extend({ reporte: reporteFields });
const schemaAnidado = z.object({ incendio: incendioFields, reporte: reporteFields });

// -------------------- CREAR INCENDIO + REPORTE --------------------
router.post('/with-reporte', guardAuth, async (req, res, next) => {
  try {
    const user = res.locals?.ctx?.user as Usuario | undefined;
    if (!user?.usuario_uuid) {
      return res.status(401).json({ error: { code: 'UNAUTHENTICATED' } });
    }

    // 3) Intentar parsear primero como plano; si falla, intentar anidado
    let body: z.infer<typeof schemaPlano>;
    try {
      body = schemaPlano.parse(req.body);
    } catch {
      const tmp = schemaAnidado.parse(req.body);
      body = { ...tmp.incendio, reporte: tmp.reporte };
    }

    // 4) Resolver estado por defecto
    const estadoUuid = body.estado_incendio_uuid ?? (await getDefaultEstadoUuid());
    if (!estadoUuid) {
      return res.status(500).json({
        error: { code: 'DEFAULT_STATE_MISSING', message: 'No existe estado por defecto en catálogo' },
        requestId: res.locals.ctx?.requestId,
      });
    }

    // 5) Institución desde el payload o perfil
    const institucionUuid =
      body.reporte.institucion_uuid ??
      (user as any)?.institucion_uuid ??
      (user as any)?.institucion?.institucion_uuid ??
      null;

    const reportanteNombre =
      `${(user as any)?.nombre ?? ''} ${(user as any)?.apellido ?? ''}`.trim() ||
      (user as any)?.email ||
      'Usuario';

    const result = await AppDataSource.transaction(async (trx) => {
      // Crear incendio
      const incRepo = trx.getRepository(Incendio);
      const inc = incRepo.create({
        titulo: body.titulo,
        descripcion: body.descripcion ?? null,
        centroide: body.centroide ?? null,
        requiere_aprobacion: true,
        aprobado: false,
        creado_por: { usuario_uuid: (user as any).usuario_uuid } as any,
        estado_incendio: { estado_incendio_uuid: estadoUuid } as any,
      } as Partial<Incendio>) as Incendio;

      const savedInc = await incRepo.save(inc);

      // Historial inicial
      await trx.getRepository(IncendioEstadoHistorial).save({
        incendio: { incendio_uuid: savedInc.incendio_uuid } as any,
        estado_incendio: { estado_incendio_uuid: estadoUuid } as any,
        cambiado_por: { usuario_uuid: (user as any).usuario_uuid } as any,
        observacion: 'Estado inicial (creación con reporte)',
      });

      // Crear reporte (ubicación = reporte.ubicacion || incendio.centroide)
      const ubicacionGeoJSON = (body.reporte.ubicacion ?? body.centroide) ?? null;

      await trx.query(
        `
        INSERT INTO reportes (
          incendio_uuid, institucion_uuid, medio_uuid, ubicacion, reportado_en,
          observaciones, telefono, departamento_uuid, municipio_uuid, lugar_poblado, finca,
          reportado_por_uuid, reportado_por_nombre, creado_en
        ) VALUES (
          $1, $2, $3,
          CASE WHEN $4::text IS NULL THEN NULL
               ELSE ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326) END,
          $5, $6, $7, $8, $9, $10, $11, $12, $13, now()
        )
        `,
        [
          savedInc.incendio_uuid,
          institucionUuid,
          body.reporte.medio_uuid,
          ubicacionGeoJSON ? JSON.stringify(ubicacionGeoJSON) : null,
          body.reporte.reportado_en ?? new Date(),
          body.reporte.observaciones ?? null,
          body.reporte.telefono ?? null,
          body.reporte.departamento_uuid ?? null,
          body.reporte.municipio_uuid ?? null,
          body.reporte.lugar_poblado ?? null,
          body.reporte.finca ?? null,
          (user as any).usuario_uuid,
          reportanteNombre,
        ]
      );

      await auditRecord({
        tabla: 'incendios',
        registro_uuid: savedInc.incendio_uuid,
        accion: 'INSERT',
        despues: savedInc,
        ctx: res.locals.ctx,
      });

      return savedInc;
    });

    const full = await AppDataSource.getRepository(Incendio).findOne({
      where: { incendio_uuid: result.incendio_uuid, eliminado_en: IsNull() },
      relations: { creado_por: true },
    });

    return res.status(201).json(full ?? result);
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
        requestId: res.locals.ctx?.requestId,
      });
    }
    next(err);
  }
});




router.get('/with-ultimo-reporte', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '2000'), 10) || 2000, 1), 5000);

    // Filtros de fecha opcionales
    const desde = req.query.desde ? new Date(String(req.query.desde)) : undefined;
    const hasta = req.query.hasta ? new Date(String(req.query.hasta)) : undefined;

    // Total
    const totalRows = await AppDataSource.query(
      `
      SELECT COUNT(*)::int AS total
      FROM incendios i
      WHERE i.eliminado_en IS NULL
        AND i.aprobado = TRUE
        AND ($1 = '' OR i.titulo ILIKE '%' || $1 || '%')
        AND ($2::timestamptz IS NULL OR i.creado_en >= $2)
        AND ($3::timestamptz IS NULL OR i.creado_en <= $3)
      `,
      [q, desde ?? null, hasta ?? null]
    );
    const total = totalRows?.[0]?.total ?? 0;

    // Items con último reporte (LATERAL) + región si existe, con fallback a depto/muni del último reporte
    const items = await AppDataSource.query(
      `
      SELECT
        i.incendio_uuid,
        i.titulo,
        i.descripcion,
        i.centroide,
        i.creado_en,
        jsonb_build_object(
          'usuario_uuid', u.usuario_uuid,
          'nombre', u.nombre,
          'apellido', u.apellido,
          'email', u.email
        ) AS creado_por,
        -- Región directa (si i.region_uuid existe y hay tabla regiones):
        CASE WHEN r.region_uuid IS NOT NULL THEN
          jsonb_build_object('region_uuid', r.region_uuid, 'nombre', r.nombre)
        ELSE
          -- Fallback: usa depto/muni del último reporte
          CASE WHEN lr.depto_nombre IS NOT NULL OR lr.muni_nombre IS NOT NULL THEN
            jsonb_build_object(
              'region_uuid', NULL,
              'nombre', trim(
                COALESCE(lr.depto_nombre,'') || 
                CASE WHEN lr.depto_nombre IS NOT NULL AND lr.muni_nombre IS NOT NULL THEN ' / ' ELSE '' END ||
                COALESCE(lr.muni_nombre,'')
              )
            )
          ELSE NULL END
        END AS region,
        CASE WHEN lr.reportado_en IS NULL THEN NULL ELSE
          jsonb_build_object(
            'reportado_por_nombre', lr.reportado_por_nombre,
            'reportado_en', lr.reportado_en,
            'telefono', lr.telefono
          )
        END AS ultimo_reporte
      FROM incendios i
      LEFT JOIN usuarios u ON u.usuario_uuid = i.creado_por_uuid
      -- ÚLTIMO REPORTE por incendio
      LEFT JOIN LATERAL (
        SELECT
          r.reportado_por_nombre,
          r.reportado_en,
          r.telefono,
          d.nombre AS depto_nombre,
          m.nombre AS muni_nombre
        FROM reportes r
        LEFT JOIN departamentos d ON d.departamento_uuid = r.departamento_uuid
        LEFT JOIN municipios   m ON m.municipio_uuid   = r.municipio_uuid
        WHERE r.eliminado_en IS NULL
          AND r.incendio_uuid = i.incendio_uuid
        ORDER BY r.reportado_en DESC NULLS LAST, r.creado_en DESC
        LIMIT 1
      ) lr ON TRUE
      -- Región por FK directa si la tienes
      LEFT JOIN regiones r ON r.region_uuid = i.region_uuid
      WHERE i.eliminado_en IS NULL
        AND i.aprobado = TRUE
        AND ($1 = '' OR i.titulo ILIKE '%' || $1 || '%')
        AND ($2::timestamptz IS NULL OR i.creado_en >= $2)
        AND ($3::timestamptz IS NULL OR i.creado_en <= $3)
      ORDER BY i.creado_en DESC
      LIMIT $4 OFFSET $5
      `,
      [q, desde ?? null, hasta ?? null, pageSize, (page - 1) * pageSize]
    );

    res.json({ total, page, pageSize, items });
  } catch (err) { next(err); }
});



// -------------------- CREAR --------------------
router.post('/', guardAuth, async (req, res, next) => {
  try {
    const body = createIncendioSchema.parse(req.body)
    const user = res.locals.ctx.user as Usuario
    const repo = AppDataSource.getRepository(Incendio)

    const estadoUuid =
      body.estado_incendio_uuid ??
      (await getDefaultEstadoUuid())

    if (!estadoUuid) {
      return res.status(500).json({
        error: { code: 'DEFAULT_STATE_MISSING', message: 'No existe estado por defecto en catálogo' },
        requestId: res.locals.ctx?.requestId
      })
    }

    const ent = repo.create({
      titulo: body.titulo,
      descripcion: body.descripcion ?? null,
      centroide: body.centroide ?? null,
      requiere_aprobacion: true,
      aprobado: false,
      creado_por: { usuario_uuid: user.usuario_uuid } as any,
      estado_incendio: { estado_incendio_uuid: estadoUuid } as any, // nunca null
    } as Partial<Incendio>) as Incendio

    const saved = await repo.save(ent)

    // historial inicial
    await AppDataSource.getRepository(IncendioEstadoHistorial).save({
      incendio: { incendio_uuid: saved.incendio_uuid } as any,
      estado_incendio: { estado_incendio_uuid: estadoUuid } as any,
      cambiado_por: { usuario_uuid: user.usuario_uuid } as any,
      observacion: 'Estado inicial',
    })

    await auditRecord({
      tabla: 'incendios',
      registro_uuid: saved.incendio_uuid,
      accion: 'INSERT',
      despues: saved,
      ctx: res.locals.ctx
    })

    res.status(201).json(saved)
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
        requestId: res.locals.ctx?.requestId
      })
    }
    next(err)
  }
})

// -------------------- ACTUALIZAR --------------------
router.patch('/:uuid', guardAuth, async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const body = updateIncendioSchema.parse(req.body)
    const user = res.locals.ctx.user as Usuario

    const repo = AppDataSource.getRepository(Incendio)

    // obtén el estado previo directamente de la tabla (columna FK)
    const prevRow = await AppDataSource.query(
      `SELECT estado_incendio_uuid FROM incendios WHERE incendio_uuid = $1 AND eliminado_en IS NULL`,
      [uuid],
    )
    if (!prevRow.length) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })
    }
    const prevEstadoUuid: string = prevRow[0].estado_incendio_uuid

    const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: IsNull() } })
    if (!inc) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })
    }

    const esCreador = (inc as any).creado_por_uuid === user.usuario_uuid
    if (!user.is_admin && !esCreador) {
      return res.status(403).json({ error: { code: 'PERMISSION_DENIED' }, requestId: res.locals.ctx?.requestId })
    }

    const before = { titulo: inc.titulo, descripcion: inc.descripcion, centroide: (inc as any).centroide }

    if (typeof body.titulo === 'string') inc.titulo = body.titulo
    if (typeof body.descripcion === 'string') (inc as any).descripcion = body.descripcion
    if (typeof body.centroide !== 'undefined') (inc as any).centroide = body.centroide ?? null

    // si viene estado_incendio_uuid, lo seteamos (NO permitir null aquí)
    let nuevoEstadoUuid: string | null = null
    if (typeof body.estado_incendio_uuid !== 'undefined') {
      nuevoEstadoUuid = body.estado_incendio_uuid
      ;(inc as any).estado_incendio = { estado_incendio_uuid: body.estado_incendio_uuid } as any
    }

    const saved = await repo.save(inc)

    // si cambió el estado, guarda historial
    if (nuevoEstadoUuid && nuevoEstadoUuid !== prevEstadoUuid) {
      await AppDataSource.getRepository(IncendioEstadoHistorial).save({
        incendio: { incendio_uuid: saved.incendio_uuid } as any,
        estado_incendio: { estado_incendio_uuid: nuevoEstadoUuid } as any,
        cambiado_por: { usuario_uuid: user.usuario_uuid } as any,
        observacion: 'Cambio de estado por edición',
      })
    }

    await auditRecord({
      tabla: 'incendios',
      registro_uuid: saved.incendio_uuid,
      accion: 'UPDATE',
      antes: before,
      despues: {
        titulo: saved.titulo,
        descripcion: (saved as any).descripcion,
        centroide: (saved as any).centroide,
        estado_incendio_uuid: nuevoEstadoUuid ?? prevEstadoUuid,
      },
      ctx: res.locals.ctx
    })

    res.json(saved)
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

// -------------------- APROBAR --------------------
router.patch('/:uuid/aprobar', guardAuth, guardAdmin, async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const repo = AppDataSource.getRepository(Incendio)
    const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: IsNull() } })
    if (!inc) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })

    const before = { aprobado: inc.aprobado, requiere_aprobacion: inc.requiere_aprobacion }
    inc.aprobado = true
    inc.requiere_aprobacion = false
    inc.aprobado_en = new Date()
    ;(inc as any).aprobado_por = { usuario_uuid: (res.locals.ctx.user as Usuario).usuario_uuid } as any
    ;(inc as any).rechazado_en = null
    ;(inc as any).rechazado_por = null
    ;(inc as any).motivo_rechazo = null

    const saved = await repo.save(inc)
    await auditRecord({
      tabla: 'incendios',
      registro_uuid: saved.incendio_uuid,
      accion: 'UPDATE',
      antes: before,
      despues: { aprobado: saved.aprobado, requiere_aprobacion: saved.requiere_aprobacion, aprobado_en: saved.aprobado_en, aprobado_por: (saved as any).aprobado_por },
      ctx: res.locals.ctx
    })

    res.json(saved)
  } catch (err) { next(err) }
})

// -------------------- RECHAZAR --------------------
router.patch('/:uuid/rechazar', guardAuth, guardAdmin, async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const { motivo_rechazo } = z.object({ motivo_rechazo: z.string().min(1) }).parse(req.body)

    const repo = AppDataSource.getRepository(Incendio)
    const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: IsNull() } })
    if (!inc) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })

    const before = { aprobado: inc.aprobado, requiere_aprobacion: inc.requiere_aprobacion }
    inc.aprobado = false
    inc.requiere_aprobacion = false
    inc.rechazado_en = new Date()
    ;(inc as any).rechazado_por = { usuario_uuid: (res.locals.ctx.user as Usuario).usuario_uuid } as any
    ;(inc as any).motivo_rechazo = motivo_rechazo

    const saved = await repo.save(inc)
    await auditRecord({
      tabla: 'incendios',
      registro_uuid: saved.incendio_uuid,
      accion: 'UPDATE',
      antes: before,
      despues: { aprobado: saved.aprobado, requiere_aprobacion: saved.requiere_aprobacion, rechazado_en: saved.rechazado_en, rechazado_por: (saved as any).rechazado_por, motivo_rechazo: (saved as any).motivo_rechazo },
      ctx: res.locals.ctx
    })

    res.json(saved)
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

export default router
