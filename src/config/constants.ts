export const SUBSCRIPTION_LIMITS = {
  free: {
    maxBanks: parseInt(process.env.FREE_MAX_BANKS || '4', 10),
    maxCategoriesPerBank: parseInt(process.env.FREE_MAX_CATEGORIES_PER_BANK || '4', 10),
  },
  pro: {
    maxBanks: Infinity,
    maxCategoriesPerBank: Infinity,
  },
};

export const PRO_SUBSCRIPTION = {
  price: parseInt(process.env.PRO_SUBSCRIPTION_PRICE || '300', 10), // Telegram Stars
  durationDays: 30,
};

export const CACHE_CONFIG = {
  ttl: parseInt(process.env.CACHE_TTL || '3600', 10) * 1000, // Convert to milliseconds
  max: 500,
};

export const RATE_LIMIT = {
  free: {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  },
  pro: {
    windowMs: 60000,
    maxRequests: 50,
  },
};

export const BOT_COMMANDS = {
  START: 'start',
  HELP: 'help',
  SEARCH: 'search',
  BANKS: 'banks',
  FAVORITES: 'favorites',
  SUBSCRIPTION: 'subscription',
  STATS: 'stats',
  ADMIN_ADD_BANK: 'admin_add_bank',
  ADMIN_PARSE_PDF: 'admin_parse_pdf',
  ADMIN_STATS: 'admin_stats',
};

export const QUERY_TYPES = {
  MCC_SEARCH: 'mcc_search',
  CATEGORY_SEARCH: 'category_search',
  FAVORITE_VIEW: 'favorite_view',
} as const;

