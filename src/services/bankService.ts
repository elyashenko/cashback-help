import { BankRepository } from '../database/repositories/BankRepository';
import { CreateBankDto } from '../types/bank';
import { Bank } from '../database/entities/Bank';
import { getCached, setCached, getCacheKey } from '../utils/cache';
import { logger } from '../utils/logger';

export class BankService {
  constructor(private bankRepository: BankRepository) {}

  async getAllBanks(activeOnly: boolean = true): Promise<Bank[]> {
    const cacheKey = getCacheKey('banks', activeOnly ? 'active' : 'all');
    
    let banks = getCached<Bank[]>(cacheKey);
    if (banks) {
      return banks;
    }

    banks = await this.bankRepository.findAll(activeOnly);
    setCached(cacheKey, banks);
    
    return banks;
  }

  async getBankById(id: number): Promise<Bank | null> {
    const cacheKey = getCacheKey('bank', id);
    
    let bank = getCached<Bank | null>(cacheKey);
    if (bank !== undefined) {
      return bank;
    }

    bank = await this.bankRepository.findById(id);
    setCached(cacheKey, bank);
    
    return bank;
  }

  async getBankByCode(code: string): Promise<Bank | null> {
    return this.bankRepository.findByCode(code);
  }

  async createBank(data: CreateBankDto): Promise<Bank> {
    try {
      const exists = await this.bankRepository.exists(data.code);
      if (exists) {
        throw new Error(`Bank with code ${data.code} already exists`);
      }

      const bank = await this.bankRepository.create(data);
      logger.info('Bank created:', { bankId: bank.id, name: bank.name });
      
      return bank;
    } catch (error) {
      logger.error('Error creating bank:', { error, data });
      throw error;
    }
  }

  async updateBank(id: number, data: Partial<CreateBankDto>): Promise<void> {
    await this.bankRepository.update(id, data);
    logger.info('Bank updated:', { bankId: id });
  }

  async toggleBankActive(id: number, isActive: boolean): Promise<void> {
    await this.bankRepository.setActive(id, isActive);
    logger.info('Bank active status changed:', { bankId: id, isActive });
  }
}

