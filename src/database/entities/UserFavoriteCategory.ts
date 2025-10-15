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
import { Bank } from './Bank';
import { CashbackCategory } from './CashbackCategory';

@Entity('user_favorite_categories')
@Index(['userId', 'bankId', 'categoryId'], { unique: true })
@Index(['userId'])
export class UserFavoriteCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer', name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'integer', name: 'bank_id' })
  bankId!: number;

  @ManyToOne(() => Bank, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bank_id' })
  bank?: Bank;

  @Column({ type: 'integer', name: 'category_id' })
  categoryId!: number;

  @ManyToOne(() => CashbackCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category?: CashbackCategory;

  @CreateDateColumn({ name: 'added_at' })
  addedAt!: Date;
}

