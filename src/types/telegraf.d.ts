import { Context } from 'telegraf';
import { BotSession } from './session';

declare module 'telegraf' {
  interface Context {
    session?: BotSession;
  }
}
