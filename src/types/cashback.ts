export interface UserCashbackSetting {
  id: number;
  userId: number;
  bankId: number;
  categoryId: number;
  cashbackRate: number; // 0-100
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserCashbackSettingDto {
  userId: number;
  bankId: number;
  categoryId: number;
  cashbackRate: number;
}

export interface UpdateUserCashbackSettingDto {
  cashbackRate?: number;
  isActive?: boolean;
}

export interface UserCashbackSettingWithRelations extends UserCashbackSetting {
  bank?: {
    id: number;
    name: string;
    code: string;
  };
  category?: {
    id: number;
    name: string;
    mccCodes: string[];
  };
}
