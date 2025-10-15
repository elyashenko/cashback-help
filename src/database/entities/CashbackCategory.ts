import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Bank } from './Bank';

@Entity('cashback_categories')
@Index(['bankId', 'name'], { unique: true })
export class CashbackCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'bank_id' })
  bankId!: number;

  @ManyToOne(() => Bank, (bank) => bank.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bank_id' })
  bank?: Bank;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', array: true, name: 'mcc_codes' })
  @Index('idx_mcc_codes', { synchronize: false })
  mccCodes!: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'cashback_rate' })
  cashbackRate?: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

