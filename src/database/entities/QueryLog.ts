import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('query_logs')
@Index(['userId'])
@Index(['createdAt'])
export class QueryLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', nullable: true, name: 'user_id' })
  userId?: number;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'text', nullable: true, name: 'query_text' })
  queryText?: string;

  @Column({ type: 'varchar', length: 50, name: 'query_type' })
  queryType!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'bank_name' })
  bankName?: string;

  @Column({ type: 'integer', name: 'response_time_ms' })
  responseTimeMs!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

