import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { CashbackCategory } from '../database/entities/CashbackCategory';
import { getCached, setCached, getCacheKey } from '../utils/cache';
import { logger } from '../utils/logger';

export class CategoryService {
  constructor(private categoryRepository: CategoryRepository) {}

  async getCategoriesByBank(bankId: number): Promise<CashbackCategory[]> {
    const cacheKey = getCacheKey('categories', 'bank', bankId);

    let categories = getCached<CashbackCategory[]>(cacheKey);
    if (categories) {
      return categories;
    }

    categories = await this.categoryRepository.findByBankId(bankId);
    setCached(cacheKey, categories);

    return categories;
  }

  async findCategoriesByMccCode(mccCode: string, bankId?: number): Promise<CashbackCategory[]> {
    try {
      const categories = await this.categoryRepository.findByMccCode(mccCode, bankId);
      logger.info('MCC search completed:', {
        mccCode,
        bankId,
        resultsCount: categories.length,
      });

      return categories;
    } catch (error) {
      logger.error('Error searching by MCC code:', { error, mccCode, bankId });
      throw error;
    }
  }

  async searchCategoriesByName(searchTerm: string, bankId?: number): Promise<CashbackCategory[]> {
    try {
      const categories = await this.categoryRepository.searchByName(searchTerm, bankId);
      logger.info('Category search completed:', {
        searchTerm,
        bankId,
        resultsCount: categories.length,
      });

      return categories;
    } catch (error) {
      logger.error('Error searching categories:', { error, searchTerm, bankId });
      throw error;
    }
  }

  async createCategory(data: {
    bankId: number;
    name: string;
    mccCodes: string[];
    cashbackRate?: number;
  }): Promise<CashbackCategory> {
    return this.categoryRepository.create(data);
  }

  async bulkCreateCategories(
    categories: Array<{
      bankId: number;
      name: string;
      mccCodes: string[];
      cashbackRate?: number;
    }>,
  ): Promise<CashbackCategory[]> {
    try {
      const created = await this.categoryRepository.bulkCreate(categories);
      logger.info('Bulk categories created:', {
        count: created.length,
        bankId: categories[0]?.bankId,
      });

      return created;
    } catch (error) {
      logger.error('Error bulk creating categories:', { error });
      throw error;
    }
  }

  async replaceBankCategories(
    bankId: number,
    categories: Array<{
      name: string;
      mccCodes: string[];
      cashbackRate?: number;
    }>,
  ): Promise<CashbackCategory[]> {
    try {
      // Delete existing categories for this bank
      await this.categoryRepository.deleteByBankId(bankId);

      // Create new categories
      const categoriesToCreate = categories.map((cat) => ({
        ...cat,
        bankId,
      }));

      return this.bulkCreateCategories(categoriesToCreate);
    } catch (error) {
      logger.error('Error replacing bank categories:', { error, bankId });
      throw error;
    }
  }
}
