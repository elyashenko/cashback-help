import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ServiceType {
  SET_CASHBACK = 'set_cashback',
  MY_CASHBACK = 'my_cashback',
  REMOVE_CASHBACK = 'remove_cashback',
  SEARCH = 'search',
  FAVORITES = 'favorites',
  SUBSCRIPTION = 'subscription',
  STATS = 'stats',
  BANKS = 'banks',
}

export enum SettingScope {
  GLOBAL = 'global', // Для всех пользователей
  USER = 'user', // Для конкретного пользователя
}

@Entity('admin_settings')
export class AdminSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: ServiceType,
    unique: true,
    name: 'service_type',
  })
  serviceType!: ServiceType;

  @Column({
    type: 'boolean',
    default: true,
    name: 'is_enabled',
  })
  isEnabled!: boolean;

  @Column({
    type: 'enum',
    enum: SettingScope,
    default: SettingScope.GLOBAL,
    name: 'scope',
  })
  scope!: SettingScope;

  @Column({
    type: 'bigint',
    nullable: true,
    name: 'user_id',
    comment: 'Telegram ID пользователя для индивидуальных настроек',
  })
  userId!: number | null;

  @Column({
    type: 'text',
    nullable: true,
    name: 'description',
    comment: 'Дополнительная информация о настройке',
  })
  description!: string | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;
}
