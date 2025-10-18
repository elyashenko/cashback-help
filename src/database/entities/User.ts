import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'bigint', unique: true, name: 'telegram_id' })
  @Index()
  telegramId!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'free',
    name: 'subscription_type',
  })
  subscriptionType!: 'free' | 'pro';

  @Column({ type: 'timestamp', nullable: true, name: 'subscription_expiry' })
  subscriptionExpiry?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'monthly_reset_date' })
  monthlyResetDate!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
