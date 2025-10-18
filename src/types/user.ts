export type SubscriptionType = 'free' | 'pro';

export interface IUser {
  id: number;
  telegramId: number;
  username?: string;
  firstName?: string;
  subscriptionType: SubscriptionType;
  subscriptionExpiry?: Date;
  monthlyResetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  telegramId: number;
  username?: string;
  firstName?: string;
}
