import { LRUCache } from 'lru-cache';
import { CACHE_CONFIG } from '../config/constants';

export const cache = new LRUCache({
  max: CACHE_CONFIG.max,
  ttl: CACHE_CONFIG.ttl,
});

export const getCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

export const getCached = <T>(key: string): T | undefined => {
  return cache.get(key) as T | undefined;
};

export const setCached = <T>(key: string, value: T, ttl?: number): void => {
  cache.set(key, value as any, { ttl });
};

export const deleteCached = (key: string): void => {
  cache.delete(key);
};

export const clearCache = (): void => {
  cache.clear();
};
