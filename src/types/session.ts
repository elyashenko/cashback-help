export interface CashbackSession {
  selectedBank?: string;
  selectedCategories?: number[];
  waitingForRates?: boolean;
  currentCategoryIndex?: number;
}

export interface FavoritesSession {
  selectedBank?: string;
  waitingForCashbackRate?: boolean;
  currentCategoryIndex?: number;
}

export interface BotSession {
  cashback?: CashbackSession;
  favorites?: FavoritesSession;
}
