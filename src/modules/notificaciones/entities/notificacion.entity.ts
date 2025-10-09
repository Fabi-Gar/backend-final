import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'notificaciones' })
@Index('idx_notif_usuario', ['usuario_uuid','creado_en'])
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  notificacion_uuid!: string;

  @Column('uuid')
  usuario_uuid!: string;

  @Column('text')
  tipo!: string;

  @Column('jsonb', { nullable: true })
  payload!: any | null;

  @Column('timestamptz', { nullable: true })
  leida_en!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en!: Date;
}
