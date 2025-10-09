import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Incendio } from '../../incendios/entities/incendio.entity'

@Entity('puntos_calor')
@Index('idx_puntos_calor_fecha', ['acq_date'])
export class PuntoCalor {
  @PrimaryGeneratedColumn('uuid', { name: 'punto_calor_uuid' })
  punto_calor_uuid!: string

  @Column({ type: 'text' })
  fuente!: string

  @Column({ type: 'text' })
  instrument!: string // VIIRS | MODIS

  @Column({ type: 'text' })
  satellite!: string // NPP | NOAA20 | TERRA | AQUA

  @Column({ type: 'text', nullable: true })
  version!: string | null

  @Column({ type: 'date' })
  acq_date!: string

  @Column({ type: 'int' })
  acq_time!: number // HHmm UTC

  @Column({ type: 'text', nullable: true })
  daynight!: string | null // D | N

  @Column({ type: 'numeric', nullable: true })
  confidence!: string | null

  @Column({ type: 'numeric', nullable: true })
  frp!: string | null

  @Column({ type: 'numeric', nullable: true })
  brightness!: string | null

  @Column({ type: 'numeric', nullable: true })
  bright_ti4!: string | null

  @Column({ type: 'numeric', nullable: true })
  bright_ti5!: string | null

  @Column({ type: 'numeric', nullable: true })
  scan!: string | null

  @Column({ type: 'numeric', nullable: true })
  track!: string | null

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  geom!: unknown

  @Column({ type: 'text', nullable: true })
  region!: string | null

  @ManyToOne(() => Incendio, { nullable: true })
  @JoinColumn({ name: 'incendio_uuid', referencedColumnName: 'incendio_uuid', foreignKeyConstraintName: 'fk_puntos_calor_incendio_uuid' })
  incendio!: Incendio | null

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' })
  creado_en!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' })
  actualizado_en!: Date

  @DeleteDateColumn({ type: 'timestamptz', name: 'eliminado_en', nullable: true })
  eliminado_en!: Date | null
}
