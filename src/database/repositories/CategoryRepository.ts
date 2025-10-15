import { AppDataSource } from '../../config/database';
import { CashbackCategory } from '../entities/CashbackCategory';
import { In } from 'typeorm';

export class CategoryRepository {
  private repository = AppDataSource.getRepository(CashbackCategory);

  async findByBankId(bankId: number, activeOnly: boolean = true): Promise<CashbackCategory[]> {
    const where: any = { bankId };
    if (activeOnly) {
      where.isActive = true;
    }
    return this.repository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<CashbackCategory | null> {
    return this.repository.findOne({ where: { id }, relations: ['bank'] });
  }

  async findByMccCode(mccCode: string, bankId?: number): Promise<CashbackCategory[]> {
    const query = this.repository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.bank', 'bank')
      .where(':mccCode = ANY(category.mcc_codes)', { mccCode })
      .andWhere('category.is_active = :isActive', { isActive: true });

    if (bankId) {
      query.andWhere('category.bank_id = :bankId', { bankId });
    }

    return query.getMany();
  }

  async searchByName(
    searchTerm: string,
    bankId?: number,
  ): Promise<CashbackCategory[]> {
    const query = this.repository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.bank', 'bank')
      .where('LOWER(category.name) LIKE LOWER(:searchTerm)', {
        searchTerm: `%${searchTerm}%`,
      })
      .andWhere('category.is_active = :isActive', { isActive: true });

    if (bankId) {
      query.andWhere('category.bank_id = :bankId', { bankId });
    }

    return query.orderBy('category.name', 'ASC').getMany();
  }

  async create(data: {
    bankId: number;
    name: string;
    mccCodes: string[];
    cashbackRate?: number;
  }): Promise<CashbackCategory> {
    const category = this.repository.create(data);
    return this.repository.save(category);
  }

  async bulkCreate(
    categories: Array<{
      bankId: number;
      name: string;
      mccCodes: string[];
      cashbackRate?: number;
    }>,
  ): Promise<CashbackCategory[]> {
    const entities = categories.map((data) => this.repository.create(data));
    return this.repository.save(entities);
  }

  async update(id: number, data: Partial<CashbackCategory>): Promise<void> {
    await this.repository.update(id, data);
  }

  async deleteByBankId(bankId: number): Promise<void> {
    await this.repository.delete({ bankId });
  }

  async findByIds(ids: number[]): Promise<CashbackCategory[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: ['bank'],
    });
  }
}

