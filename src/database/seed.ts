import 'reflect-metadata';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { initializeDatabase } from '../config/database';
import { BankService } from '../services/bankService';
import { CategoryService } from '../services/categoryService';
import { BankRepository } from './repositories/BankRepository';
import { CategoryRepository } from './repositories/CategoryRepository';
import { logger } from '../utils/logger';

dotenv.config();

async function seed() {
  try {
    logger.info('Starting database seed...');

    await initializeDatabase();

    const bankRepository = new BankRepository();
    const categoryRepository = new CategoryRepository();
    const bankService = new BankService(bankRepository);
    const categoryService = new CategoryService(categoryRepository);

    // Load Sberbank data
    logger.info('Loading Sberbank data...');
    const sberbankData = JSON.parse(
      readFileSync(join(__dirname, '../../data/banks/sberbank.json'), 'utf-8'),
    );

    const sberbank = await bankService.createBank({
      name: sberbankData.bank.name,
      code: sberbankData.bank.code,
      logoUrl: sberbankData.bank.logoUrl,
    });

    const sberbankCategories = sberbankData.categories.map((cat: any) => ({
      bankId: sberbank.id,
      name: cat.name,
      mccCodes: cat.mccCodes,
      cashbackRate: cat.cashbackRate,
    }));

    await categoryService.bulkCreateCategories(sberbankCategories);

    // Load Tinkoff data
    logger.info('Loading Tinkoff data...');
    const tinkoffData = JSON.parse(
      readFileSync(join(__dirname, '../../data/banks/tinkoff.json'), 'utf-8'),
    );

    const tinkoff = await bankService.createBank({
      name: tinkoffData.bank.name,
      code: tinkoffData.bank.code,
      logoUrl: tinkoffData.bank.logoUrl,
    });

    const tinkoffCategories = tinkoffData.categories.map((cat: any) => ({
      bankId: tinkoff.id,
      name: cat.name,
      mccCodes: cat.mccCodes,
      cashbackRate: cat.cashbackRate,
    }));

    await categoryService.bulkCreateCategories(tinkoffCategories);

    logger.info('✅ Database seeded successfully!');
    logger.info(`Banks created: 2`);
    logger.info(`Categories created: ${sberbankCategories.length + tinkoffCategories.length}`);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

