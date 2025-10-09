import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm'
import { Reporte } from './reporte.entity'

@Index('idx_fotos_reporte_reporte', ['reporte'])
@Entity('fotos_reporte')
export class FotoReporte {
  @PrimaryGeneratedColumn('uuid', { name: 'foto_reporte_uuid' })
  foto_reporte_uuid!: string

  @ManyToOne(() => Reporte, { nullable: false })
  @JoinColumn({ name: 'reporte_uuid', referencedColumnName: 'reporte_uuid', foreignKeyConstraintName: 'fk_fotos_reporte_reporte_uuid' })
  reporte!: Reporte

  @Column({ type: 'text' })
  url!: string

  @Column({ type: 'text', nullable: true })
  credito!: string | null

  @CreateDateColumn({ type: 'timestamptz', name: 'creado_en', default: () => 'now()' })
  creado_en!: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'actualizado_en', default: () => 'now()' })
  actualizado_en!: Date

  @DeleteDateColumn({ type: 'timestamptz', name: 'eliminado_en', nullable: true })
  eliminado_en!: Date | null
}
