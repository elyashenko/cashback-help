export interface IBank {
  id: number;
  name: string;
  code: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateBankDto {
  name: string;
  code: string;
  logoUrl?: string;
}
