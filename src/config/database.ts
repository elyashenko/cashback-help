import { DataSource } from 'typeorm';
import { User } from '../database/entities/User';
import { Bank } from '../database/entities/Bank';
import { CashbackCategory } from '../database/entities/CashbackCategory';
import { UserFavoriteCategory } from '../database/entities/UserFavoriteCategory';
import { UserCashbackSetting } from '../database/entities/UserCashbackSetting';
import { PaymentHistory } from '../database/entities/PaymentHistory';
import { QueryLog } from '../database/entities/QueryLog';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Use migrations in production
  logging: process.env.DATABASE_LOGGING === 'true',
  entities: [
    User,
    Bank,
    CashbackCategory,
    UserFavoriteCategory,
    UserCashbackSetting,
    PaymentHistory,
    QueryLog,
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  extra: {
    max: 20,
    connectionTimeoutMillis: 5000,
  },
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};
