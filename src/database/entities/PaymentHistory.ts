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

@Entity('payment_history')
@Index(['userId'])
export class PaymentHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'transaction_id' })
  transactionId!: string;

  @Column({ type: 'integer' })
  amount!: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'completed' | 'failed' | 'refunded';

  @Column({ type: 'varchar', length: 10, name: 'subscription_type' })
  subscriptionType!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

