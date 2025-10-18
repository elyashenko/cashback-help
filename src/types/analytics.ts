export type QueryType = 'mcc_search' | 'category_search' | 'favorite_view';

export interface QueryLogDto {
  userId: number;
  queryText?: string;
  queryType: QueryType;
  bankName?: string;
  responseTimeMs: number;
}

export interface UserStats {
  totalQueries: number;
  queriesByType: Record<QueryType, number>;
  favoriteCategories: number;
  subscriptionType: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  totalQueries: number;
  averageResponseTime: number;
  popularBanks: Array<{ name: string; count: number }>;
}
