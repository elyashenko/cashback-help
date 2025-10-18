import { Context } from 'telegraf';
import { BotSession } from './session';

export interface SessionData {
  searchMode?: 'category' | 'mcc';
  selectedBank?: string;
}

export interface BotContext extends Context {
  session?: BotSession;
}
