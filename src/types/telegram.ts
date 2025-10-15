import { Context } from 'telegraf';

export interface SessionData {
  searchMode?: 'category' | 'mcc';
  selectedBank?: string;
}

export interface BotContext extends Context {
  session?: SessionData;
}

