import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './User';
import { Bank } from './Bank';
import { CashbackCategory } from './CashbackCategory';

@Entity('user_cashback_settings')
@Unique(['userId', 'bankId', 'categoryId'])
export class UserCashbackSetting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  @Index()
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'integer', name: 'bank_id' })
  @Index()
  bankId!: number;

  @ManyToOne(() => Bank, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bank_id' })
  bank?: Bank;

  @Column({ type: 'integer', name: 'category_id' })
  @Index()
  categoryId!: number;

  @ManyToOne(() => CashbackCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category?: CashbackCategory;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'cashback_rate',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  cashbackRate!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
