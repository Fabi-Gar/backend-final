import { AppDataSource } from '../../db/data-source'
import { Incendio } from './entities/incendio.entity'
import { Reporte } from './entities/reporte.entity'
import { auditRecord } from '../auditoria/auditoria.service'
import { IsNull } from 'typeorm'

type Ctx = {
  requestId: string
  ip: string
  ua: string
  user: { usuario_uuid: string; is_admin?: boolean } | null
}

export async function crearReporte(input: any, ctx: Ctx) {
  if (!ctx.user?.usuario_uuid) {
    const e: any = new Error('Auth requerido')
    e.status = 401
    e.code = 'UNAUTHENTICATED'
    throw e
  }

  const repRepo = AppDataSource.getRepository(Reporte)
  const incRepo = AppDataSource.getRepository(Incendio)

  const reporte = repRepo.create({
    // relaciones por id
    incendio: input.incendio_uuid ? ({ incendio_uuid: input.incendio_uuid } as any) : null,
    reportado_por: { usuario_uuid: ctx.user.usuario_uuid } as any,

    // campos simples
    reportado_por_nombre: input.reportado_por_nombre,
    institucion: input.institucion_uuid ? ({ institucion_uuid: input.institucion_uuid } as any) : null,
    telefono: input.telefono ?? null,
    reportado_en: new Date(input.reportado_en),
    medio: { medio_uuid: input.medio_uuid } as any,
    ubicacion: input.ubicacion,
    departamento: input.departamento_uuid ? ({ departamento_uuid: input.departamento_uuid } as any) : null,
    municipio: input.municipio_uuid ? ({ municipio_uuid: input.municipio_uuid } as any) : null,
    lugar_poblado: input.lugar_poblado ?? null,
    finca: input.finca ?? null,
    observaciones: input.observaciones ?? null
  })

  // save devuelve Reporte (objeto), no array
  const saved = await repRepo.save(reporte)

  // REGLA: si el reporte pertenece a un incendio y ese incendio no tiene centroide, setearlo desde la ubicacion del reporte
  const incendioUuid = input.incendio_uuid || saved.incendio?.incendio_uuid || null
  if (incendioUuid) {
    const inc = await incRepo.findOne({
      where: { incendio_uuid: incendioUuid, eliminado_en: IsNull() }
    })
    if (inc && !inc.centroide) {
      const before = { centroide: null as any }
      inc.centroide = saved.ubicacion
      await incRepo.save(inc)
      await auditRecord({
        tabla: 'incendios',
        registro_uuid: inc.incendio_uuid,
        accion: 'UPDATE',
        antes: before,
        despues: { centroide: inc.centroide },
        ctx
      })
    }
  }

  await auditRecord({
    tabla: 'reportes',
    registro_uuid: saved.reporte_uuid,
    accion: 'INSERT',
    despues: saved,
    ctx
  })

  return saved
}
