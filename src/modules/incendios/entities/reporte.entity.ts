import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Incendio } from './incendio.entity'
import { Usuario } from '../../seguridad/entities/usuario.entity'
import { Institucion } from '../../seguridad/entities/institucion.entity'
import { Medio } from '../../catalogos/entities/medio.entity'
import { Departamento } from '../../catalogos/entities/departamento.entity'
import { Municipio } from '../../catalogos/entities/municipio.entity'

@Index('idx_reportes_incendio', ['incendio'])
@Index('idx_reportes_reportado_en', ['reportado_en'])
@Entity('reportes')
export class Reporte {
  @PrimaryGeneratedColumn('uuid', { name: 'reporte_uuid' })
  reporte_uuid!: string

  @ManyToOne(() => Incendio, { nullable: true })
  @JoinColumn({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_reportes_incendio_uuid' })
  incendio!: Incendio | null

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'reportado_por_uuid', referencedColumnName: 'usuario_uuid', foreignKeyConstraintName: 'fk_reportes_reportado_por_uuid' })
  reportado_por!: Usuario

  @Column({ type: 'text' })
  reportado_por_nombre!: string

  @ManyToOne(() => Institucion, { nullable: true })
  @JoinColumn({ name: 'institucion_uuid', referencedColumnName: 'institucion_uuid', foreignKeyConstraintName: 'fk_reportes_institucion_uuid' })
  institucion!: Institucion | null

  @Column({ type: 'text', nullable: true })
  telefono!: string | null

  @Column({ type: 'timestamptz' })
  reportado_en!: Date

  @ManyToOne(() => Medio, { nullable: false })
  @JoinColumn({ name: 'medio_uuid', referencedColumnName: 'medio_uuid', foreignKeyConstraintName: 'fk_reportes_medio_uuid' })
  medio!: Medio

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  ubicacion!: unknown

  @ManyToOne(() => Departamento, { nullable: true })
  @JoinColumn({ name: 'departamento_uuid', referencedColumnName: 'departamento_uuid', foreignKeyConstraintName: 'fk_reportes_departamento_uuid' })
  departamento!: Departamento | null

  @ManyToOne(() => Municipio, { nullable: true })
  @JoinColumn({ name: 'municipio_uuid', referencedColumnName: 'municipio_uuid', foreignKeyConstraintName: 'fk_reportes_municipio_uuid' })
  municipio!: Municipio | null

  @Column({ type: 'text', nullable: true })
  lugar_poblado!: string | null

  @Column({ type: 'text', nullable: true })
  finca!: string | null

  @Column({ type: 'text', nullable: true })
  observaciones!: string | null

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' })
  creado_en!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' })
  actualizado_en!: Date

  @DeleteDateColumn({ type: 'timestamptz', name: 'eliminado_en', nullable: true })
  eliminado_en!: Date | null
}
