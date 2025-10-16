import {
  Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany, Unique
} from 'typeorm';
import { UserPushToken } from './UserPushToken';

@Entity({ name: 'user_push_prefs' })
@Unique(['userId'])
export class UserPushPrefs {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_user_push_prefs_user_id')
  @Column({ name: 'user_id', type: 'varchar', length: 64 })
  userId!: string;

  @Column('text', { name: 'regiones_suscritas', array: true, default: '{}' })
  regionesSuscritas!: string[];

  @Column({ name: 'avisarme_aprobado', type: 'boolean', default: true })
  avisarmeAprobado!: boolean;

  @Column({ name: 'extra', type: 'jsonb', nullable: true })
  extra?: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => UserPushToken, (t) => t.prefs, { cascade: true })
  tokens!: UserPushToken[];
}
