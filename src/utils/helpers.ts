import { SubscriptionType } from '../types/user';

/**
 * Check if a subscription is active
 */
export const isSubscriptionActive = (
  type: SubscriptionType,
  expiryDate?: Date,
): boolean => {
  if (type === 'free') return true;
  if (!expiryDate) return false;
  return expiryDate > new Date();
};

/**
 * Calculate subscription expiry date
 */
export const calculateExpiryDate = (durationDays: number): Date => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + durationDays);
  return expiry;
};

/**
 * Check if it's the first day of the month (for monthly reset)
 */
export const isMonthlyResetDay = (resetDate: Date): boolean => {
  const now = new Date();
  const lastReset = new Date(resetDate);
  
  return (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  );
};

/**
 * Validate MCC code format (4 digits)
 */
export const isValidMccCode = (code: string): boolean => {
  return /^\d{4}$/.test(code);
};

/**
 * Format subscription expiry date for display
 */
export const formatExpiryDate = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Escape markdown special characters for Telegram
 */
export const escapeMarkdown = (text: string): string => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

/**
 * Measure execution time of async function
 */
export const measureTime = async <T>(
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
};

