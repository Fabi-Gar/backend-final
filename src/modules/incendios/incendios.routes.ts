// src/modules/incendios/incendios.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../db/data-source'
import { Incendio } from './entities/incendio.entity'
import { Usuario } from '../seguridad/entities/usuario.entity'
import { FindOptionsWhere, ILike, IsNull, Between } from 'typeorm'
import { guardAuth, guardAdmin } from '../../middlewares/auth'
import multer from 'multer'
import { 
  notifyIncendioAprobado,
  notifyIncendioActualizado, 
  notifyIncendioNuevoMunicipio,
  notifyIncendioCerrado
} from '../notificaciones/incendioNotify.service'
import { Notificacion } from '../notificaciones/entities/notificacion.entity'
import { auditRecord } from '../auditoria/auditoria.service'
import { EstadoIncendio } from '../catalogos/entities/estado-incendio.entity'
import { IncendioEstadoHistorial } from './entities/incendio-estado-historial.entity'
import fs from 'fs/promises'
import path from 'path'
import mime from 'mime-types'
import { FotoReporte } from '../../modules/incendios/entities/foto-reporte.entity'
import { env } from 'process'
import { PushPrefsRepo } from '../notificaciones/pushPrefs.repo'
import { sendExpoPush } from '../notificaciones/expoPush.service'
const router = Router()



// --- helpers ---
const point4326 = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
})


// --- helpers de error PG ---
type PgMapped = { status: number; body: any } | null

function mapPgError(err: any, traceId?: string): PgMapped {
  const e = err?.driverError ?? err
  const code = e?.code
  const detail: string | undefined = e?.detail
  const constraint: string | undefined = e?.constraint
  const table: string | undefined = e?.table
  const message: string | undefined = e?.message

  // FK violation
  if (code === '23503') {
    // detail: 'Key (medio_uuid)=(...) is not present in table "catalogo_medios".'
    let column: string | undefined
    let value: string | undefined
    let refTable: string | undefined
    const m = /Key \((.+)\)=\((.+)\) is not present in table "(.+)"/i.exec(detail || '')
    if (m) {
      column = m[1]
      value = m[2]
      refTable = m[3]
    }
    return {
      status: 422,
      body: {
        error: {
          code: 'FK_VIOLATION',
          message: 'Referencia no válida a una clave foránea.',
          traceId,
          pg: { code, constraint, table, detail, column, value, refTable },
          hint: column ? `Revisa que el valor de "${column}" exista en "${refTable}".` : undefined,
        },
      },
    }
  }

  // Unique violation
  if (code === '23505') {
    // detail: 'Key (campo)=(valor) already exists.'
    let column: string | undefined
    let value: string | undefined
    const m = /Key \((.+)\)=\((.+)\) already exists/i.exec(detail || '')
    if (m) {
      column = m[1]
      value = m[2]
    }
    return {
      status: 409,
      body: {
        error: {
          code: 'UNIQUE_VIOLATION',
          message: 'Registro duplicado.',
          traceId,
          pg: { code, constraint, table, detail, column, value },
        },
      },
    }
  }

  // Not null violation
  if (code === '23502') {
    return {
      status: 422,
      body: {
        error: {
          code: 'NOT_NULL_VIOLATION',
          message: 'Campo requerido no puede ser NULL.',
          traceId,
          pg: { code, constraint, table, detail },
        },
      },
    }
  }

  // Invalid text representation / cast
  if (code === '22P02') {
    return {
      status: 400,
      body: {
        error: {
          code: 'INVALID_TEXT_REPRESENTATION',
          message: 'Formato inválido en algún campo (ej. UUID/fecha/número).',
          traceId,
          pg: { code, detail },
        },
      },
    }
  }

  // PostGIS / GeoJSON (a veces XX000 o 22023 con mensajes de parseo)
  if (code === 'XX000' || code === '22023' || /GeoJSON|ST_GeomFromGeoJSON/i.test(message || '')) {
    return {
      status: 400,
      body: {
        error: {
          code: 'GEOMETRY_PARSE_ERROR',
          message: 'GeoJSON inválido o geometría no válida.',
          traceId,
          pg: { code, detail, message },
        },
      },
    }
  }

  // Por defecto
  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor.',
        traceId,
        pg: { code, constraint, table, detail, message },
      },
    },
  }
}



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

// -------------------- CREAR INCENDIO + REPORTE (con foto opcional por multipart/form-data) --------------------

// directorio y base pública (misma lógica que fotos-reporte.routes.ts)
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads')
const PUBLIC_BASE = env.MEDIA_BASE_URL ?? `http://localhost:${env.PORT || 4000}`

async function ensureUploadsDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
}

// Multer en memoria (10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

// 🔹 Esquemas
const incendioFields = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().nullish(),
  centroide: point4326.nullish(),
  estado_incendio_uuid: z.string().uuid().optional(),
})

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
  credito: z.string().optional().nullable(),
})

const schemaPlano = incendioFields.extend({ reporte: reporteFields })
const schemaAnidado = z.object({ incendio: incendioFields, reporte: reporteFields })

router.post('/with-reporte',guardAuth,upload.single('file'),
  async (req, res, next) => {
    try {
      const user = res.locals?.ctx?.user as Usuario | undefined
      if (!user?.usuario_uuid) {
        return res.status(401).json({ error: { code: 'UNAUTHENTICATED' } })
      }

      let body: z.infer<typeof schemaPlano>
      if (req.is('multipart/form-data')) {
        const incendioRaw = req.body?.incendio
        const reporteRaw = req.body?.reporte
        if (!incendioRaw || !reporteRaw) {
          return res.status(400).json({
            error: { code: 'BAD_REQUEST', message: 'Campos "incendio" y "reporte" requeridos como JSON (form-data).' }
          })
        }
        const incendio = incendioFields.parse(JSON.parse(String(incendioRaw)))
        const reporte = reporteFields.parse(JSON.parse(String(reporteRaw)))
        body = { ...incendio, reporte }
      } else {
        try {
          body = schemaPlano.parse(req.body)
        } catch {
          const tmp = schemaAnidado.parse(req.body)
          body = { ...tmp.incendio, reporte: tmp.reporte }
        }
      }

      const estadoUuid = body.estado_incendio_uuid ?? (await getDefaultEstadoUuid())
      if (!estadoUuid) {
        return res.status(500).json({
          error: { code: 'DEFAULT_STATE_MISSING', message: 'No existe estado por defecto' },
        })
      }

      const institucionUuid =
        body.reporte.institucion_uuid ??
        (user as any)?.institucion_uuid ??
        (user as any)?.institucion?.institucion_uuid ??
        null

      const reportanteNombre =
        `${(user as any)?.nombre ?? ''} ${(user as any)?.apellido ?? ''}`.trim() ||
        (user as any)?.email ||
        'Usuario'

      const result = await AppDataSource.transaction(async (trx) => {
        const incRepo = trx.getRepository(Incendio)
        const inc = incRepo.create({
          titulo: body.titulo,
          descripcion: body.descripcion ?? null,
          centroide: body.centroide ?? null,
          requiere_aprobacion: true,
          aprobado: false,
          creado_por: { usuario_uuid: (user as any).usuario_uuid } as any,
          estado_incendio: { estado_incendio_uuid: estadoUuid } as any,
        }) as Incendio
        const savedInc = await incRepo.save(inc)

        await trx.getRepository(IncendioEstadoHistorial).save({
          incendio: { incendio_uuid: savedInc.incendio_uuid } as any,
          estado_incendio: { estado_incendio_uuid: estadoUuid } as any,
          cambiado_por: { usuario_uuid: (user as any).usuario_uuid } as any,
          observacion: 'Estado inicial (creación con reporte)',
        })

        const ubicacionGeoJSON = (body.reporte.ubicacion ?? body.centroide) ?? null
        const inserted = await trx.query(
          `
          INSERT INTO reportes (
            incendio_uuid, institucion_uuid, medio_uuid, ubicacion, reportado_en,
            observaciones, telefono, departamento_uuid, municipio_uuid, lugar_poblado, finca,
            reportado_por_uuid, reportado_por_nombre, creado_en
          ) VALUES (
            $1, $2, $3,
            CASE WHEN $4::text IS NULL THEN NULL
                 ELSE ST_SetSRID(ST_GeomFromGeoJSON($4::text), 4326) END,
            $5, $6, $7, $8, $9, $10, $11,
            $12, $13, now()
          )
          RETURNING reporte_uuid
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
        )

        const createdReporteUuid: string | undefined = inserted?.[0]?.reporte_uuid

        let createdFoto: {
          foto_reporte_uuid: string
          url: string
          credito: string | null
          creado_en: Date
        } | null = null

        if (createdReporteUuid && req.file) {
          const { buffer, originalname, mimetype } = req.file
          if (!/^image\//.test(mimetype || '')) {
            const err = new Error('El archivo debe ser image/*') as any
            err.status = 400
            err.code = 'BAD_IMAGE'
            throw err
          }
          await ensureUploadsDir()
          const ext =
            mime.extension(mimetype) ||
            (path.extname(originalname || '').replace('.', '') || 'jpg')
          const filename = `${createdReporteUuid}-${Date.now()}.${ext}`

          await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer)
          const publicUrl = `${PUBLIC_BASE}/uploads/${filename}`

          const savedFoto = await trx.getRepository(FotoReporte).save({
            reporte: { reporte_uuid: createdReporteUuid } as any,
            url: publicUrl,
            credito: body.reporte.credito ?? null,
            creado_por: { usuario_uuid: (user as any).usuario_uuid } as any,
          })

          createdFoto = {
            foto_reporte_uuid: savedFoto.foto_reporte_uuid,
            url: savedFoto.url,
            credito: savedFoto.credito ?? null,
            creado_en: savedFoto.creado_en,
          }
        }

        await auditRecord({
          tabla: 'incendios',
          registro_uuid: savedInc.incendio_uuid,
          accion: 'INSERT',
          despues: savedInc,
          ctx: res.locals.ctx,
        })

        return { savedInc, createdReporteUuid, createdFoto }
      })

      // ✅ NOTIFICAR A ADMINS que hay un incendio pendiente de aprobación
      try {
        // Obtener todos los usuarios admin
        const admins = await AppDataSource.query(
          `SELECT u.usuario_uuid 
           FROM usuarios u
           WHERE u.is_admin = true AND u.eliminado_en IS NULL`
        )

        const adminIds = admins.map((a: any) => a.usuario_uuid)
        
        if (adminIds.length > 0) {
          const notiRepo = AppDataSource.getRepository(Notificacion)
          
          for (const adminId of adminIds) {
            await notiRepo.save({
              usuario_uuid: adminId,
              tipo: 'incendio_pendiente_aprobacion',
              titulo: '⚠️ Nuevo incendio pendiente de aprobación',
              mensaje: `"${result.savedInc.titulo}" requiere tu aprobación`,
              payload: {
                incendio_id: result.savedInc.incendio_uuid,
                creado_por: (user as any).usuario_uuid,
              },
            })
          }

          // ✅ NUEVO: Enviar push notification
          const tokens = await PushPrefsRepo.getTokensForUserIds(adminIds)
          
          if (tokens.length > 0) {
            await sendExpoPush(tokens, {
              title: '⚠️ Nuevo incendio pendiente',
              body: `"${result.savedInc.titulo}" requiere aprobación`,
              data: {
                tipo: 'incendio_pendiente_aprobacion',
                incendio_id: result.savedInc.incendio_uuid,
                deeplink: `/admin/incendios/${result.savedInc.incendio_uuid}`,
              },
            })
            console.log(`📱 Push enviado a ${tokens.length} token(s) de admins`)
          }

          console.log(`📢 ${adminIds.length} admin(s) notificados de nuevo incendio: ${result.savedInc.titulo}`)
        }
      } catch (notifError) {
        console.error('[notificacion] Error notificando admins:', notifError)
        // No bloqueamos la respuesta si falla la notificación
      }

      const full = await AppDataSource.getRepository(Incendio).findOne({
        where: { incendio_uuid: result.savedInc.incendio_uuid, eliminado_en: IsNull() },
        relations: { creado_por: true },
      })

      return res.status(201).json({
        ...((full ?? result.savedInc) as any),
        reporte_uuid: result.createdReporteUuid ?? null,
        ...(result.createdFoto
          ? { foto: result.createdFoto }
          : {}),
      })
    } catch (err: any) {
      if (err?.issues) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
          requestId: res.locals.ctx?.requestId,
        })
      }
      const mapped = mapPgError(err, res.locals.ctx?.requestId)
      if (mapped) {
        console.error('[with-reporte][pg-error]', {
          traceId: res.locals.ctx?.requestId,
          code: err?.driverError?.code || err?.code,
          constraint: err?.driverError?.constraint || err?.constraint,
          table: err?.driverError?.table || err?.table,
          detail: err?.driverError?.detail || err?.detail,
          message: err?.driverError?.message || err?.message,
          stack: err?.stack,
        })
        return res.status(mapped.status).json(mapped.body)
      }
      next(err)
    }
  }
)


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

    const prevRow = await AppDataSource.query(
      `SELECT estado_incendio_uuid FROM incendios WHERE incendio_uuid = $1 AND eliminado_en IS NULL`,
      [uuid],
    )
    if (!prevRow.length) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })
    }
    const prevEstadoUuid: string = prevRow[0].estado_incendio_uuid

    const inc = await repo.findOne({ 
      where: { incendio_uuid: uuid, eliminado_en: IsNull() },
      relations: ['creado_por'] // ✅ Cargar relación
    })
    if (!inc) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })
    }

    const esCreador = (inc as any).creado_por_uuid === user.usuario_uuid
    if (!user.is_admin && !esCreador) {
      return res.status(403).json({ error: { code: 'PERMISSION_DENIED' }, requestId: res.locals.ctx?.requestId })
    }

    const before = { titulo: inc.titulo, descripcion: inc.descripcion, centroide: (inc as any).centroide }

    // ✅ Detectar cambios para notificación
    let cambiosTexto: string[] = []
    
    if (typeof body.titulo === 'string' && body.titulo !== inc.titulo) {
      cambiosTexto.push('Título actualizado')
      inc.titulo = body.titulo
    }
    if (typeof body.descripcion === 'string' && body.descripcion !== inc.descripcion) {
      cambiosTexto.push('Descripción actualizada')
      ;(inc as any).descripcion = body.descripcion
    }
    if (typeof body.centroide !== 'undefined') {
      cambiosTexto.push('Ubicación actualizada')
      ;(inc as any).centroide = body.centroide ?? null
    }

    let nuevoEstadoUuid: string | null = null
    let estadoCambio = false
    if (typeof body.estado_incendio_uuid !== 'undefined') {
      nuevoEstadoUuid = body.estado_incendio_uuid
      estadoCambio = nuevoEstadoUuid !== prevEstadoUuid
      if (estadoCambio) {
        cambiosTexto.push('Estado cambiado')
      }
      ;(inc as any).estado_incendio = { estado_incendio_uuid: body.estado_incendio_uuid } as any
    }

    const saved = await repo.save(inc)

    if (nuevoEstadoUuid && estadoCambio) {
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

    if (cambiosTexto.length > 0 && saved.aprobado) {
      try {
        await notifyIncendioActualizado({
          id: saved.incendio_uuid,
          titulo: saved.titulo ?? undefined,
          creadorUserId: (saved as any).creado_por_uuid,
          seguidoresUserIds: [],
          cambios: cambiosTexto.join(', '),
        })

        // Guardar en BD
        const notiRepo = AppDataSource.getRepository(Notificacion)
        await notiRepo.save({
          usuario_uuid: (saved as any).creado_por_uuid,
          tipo: 'incendio_actualizado',
          payload: {
            incendio_id: saved.incendio_uuid,
            cambios: cambiosTexto,
          },
          leida_en: null,
        })
      } catch (notifError) {
        console.error('[notificacion] Error enviando actualización:', notifError)
      }
    }

    res.json(saved)
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

// -------------------- APROBAR --------------------
// En incendios.routes.ts - endpoint PATCH /:uuid/aprobar
router.patch('/:uuid/aprobar', guardAuth, guardAdmin, async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const repo = AppDataSource.getRepository(Incendio)
    
    const inc = await repo.findOne({ 
      where: { incendio_uuid: uuid, eliminado_en: IsNull() },
      relations: ['creado_por'] // ✅ Cargar relación
    })
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

    // ✅ FIX 1: Notificar al creador
    try {
      const creadorUserId = inc.creado_por?.usuario_uuid

      if (!creadorUserId) {
        console.error('❌ No se pudo obtener creado_por_uuid del incendio')
      } else {
        await notifyIncendioAprobado({
          id: saved.incendio_uuid,
          titulo: saved.titulo ?? undefined,
          creadorUserId: creadorUserId,
        })

        // Guardar en BD
        const notiRepo = AppDataSource.getRepository(Notificacion)
        await notiRepo.save({
          usuario_uuid: creadorUserId,
          tipo: 'incendio_aprobado',
          titulo: '✅ Tu incendio fue aprobado',
          mensaje: `"${saved.titulo}" ha sido aprobado por un administrador`,
          payload: {
            incendio_id: saved.incendio_uuid,
            titulo: saved.titulo,
          },
        })
        console.log('✅ Notificación de aprobación enviada al creador')
      }
    } catch (notifError) {
      console.error('[notificacion] Error notificando aprobación:', notifError)
    }

    // ✅ FIX 2: Notificar a usuarios del municipio (usando UUID)
    try {
      // Obtener municipio_uuid del último reporte
      const reporteData = await AppDataSource.query(
        `SELECT r.municipio_uuid, m.nombre
         FROM reportes r
         LEFT JOIN municipios m ON m.municipio_uuid = r.municipio_uuid
         WHERE r.incendio_uuid = $1 AND r.eliminado_en IS NULL
         ORDER BY r.reportado_en DESC NULLS LAST, r.creado_en DESC
         LIMIT 1`,
        [saved.incendio_uuid]
      )

      if (reporteData?.[0]?.municipio_uuid) {
        // Usar municipio_uuid como identificador
        await notifyIncendioNuevoMunicipio({
          id: saved.incendio_uuid,
          titulo: saved.titulo ?? undefined,
          municipioCode: reporteData[0].municipio_uuid, // ✅ Usar UUID
          ubicacion: reporteData[0].nombre || 'Sin ubicación',
        })
        console.log(`✅ Notificación enviada a usuarios del municipio: ${reporteData[0].nombre}`)
      }
    } catch (notifError) {
      console.error('[notificacion] Error notificando región:', notifError)
    }

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
