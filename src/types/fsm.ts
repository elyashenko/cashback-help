// FSM States for Telegram Bot
export enum BotState {
  IDLE = 'idle',
  SETTING_CASHBACK_BANK = 'setting_cashback_bank',
  SETTING_CASHBACK_CATEGORIES = 'setting_cashback_categories',
  SETTING_CASHBACK_RATES = 'setting_cashback_rates',
  ADDING_FAVORITES_BANK = 'adding_favorites_bank',
  ADDING_FAVORITES_CATEGORY = 'adding_favorites_category',
  ADDING_FAVORITES_RATE = 'adding_favorites_rate',
  SEARCHING = 'searching',
  WAITING_FOR_PAYMENT = 'waiting_for_payment',
}

// Extended session interface with FSM state
export interface FSMSession {
  state: BotState;
  data?: Record<string, any>;
}

// Update the main session interface
export interface BotSession {
  cashback?: CashbackSession;
  favorites?: FavoritesSession;
  fsm?: FSMSession;
}

// Legacy interfaces for backward compatibility
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
