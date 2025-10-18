import { AppDataSource } from '../../config/database';
import { Bank } from '../entities/Bank';
import { CreateBankDto } from '../../types/bank';

export class BankRepository {
  private repository = AppDataSource.getRepository(Bank);

  async findAll(activeOnly: boolean = true): Promise<Bank[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.repository.find({ where, order: { name: 'ASC' } });
  }

  async findById(id: number): Promise<Bank | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<Bank | null> {
    return this.repository.findOne({ where: { code } });
  }

  async create(data: CreateBankDto): Promise<Bank> {
    const bank = this.repository.create(data);
    return this.repository.save(bank);
  }

  async update(id: number, data: Partial<CreateBankDto>): Promise<void> {
    await this.repository.update(id, data);
  }

  async setActive(id: number, isActive: boolean): Promise<void> {
    await this.repository.update(id, { isActive });
  }

  async exists(code: string): Promise<boolean> {
    const count = await this.repository.count({ where: { code } });
    return count > 0;
  }
}
