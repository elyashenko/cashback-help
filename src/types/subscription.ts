import { SubscriptionType } from './user';

export interface SubscriptionLimits {
  maxBanks: number;
  maxCategoriesPerBank: number;
}

export interface SubscriptionStatus {
  type: SubscriptionType;
  isActive: boolean;
  expiryDate?: Date;
  limits: SubscriptionLimits;
}

export interface UpgradeToProDto {
  userId: number;
  durationDays: number;
  transactionId: string;
}
