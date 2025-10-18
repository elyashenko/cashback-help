import { BotState } from '../types/fsm';
import { logger } from '../utils/logger';

export class FSMManager {
  /**
   * Set FSM state for user session
   */
  static setState(session: any, state: BotState, data?: Record<string, any>): void {
    if (!session.fsm) {
      session.fsm = { state: BotState.IDLE };
    }
    
    session.fsm.state = state;
    if (data) {
      session.fsm.data = { ...session.fsm.data, ...data };
    }
    
    logger.debug(`FSM State changed to: ${state}`, { 
      userId: session.userId, 
      state, 
      data 
    });
  }

  /**
   * Get current FSM state
   */
  static getState(session: any): BotState {
    return session.fsm?.state || BotState.IDLE;
  }

  /**
   * Get FSM data
   */
  static getData(session: any, key?: string): any {
    if (!session.fsm?.data) return undefined;
    
    if (key) {
      return session.fsm.data[key];
    }
    
    return session.fsm.data;
  }

  /**
   * Set FSM data
   */
  static setData(session: any, key: string, value: any): void {
    if (!session.fsm) {
      session.fsm = { state: BotState.IDLE };
    }
    
    if (!session.fsm.data) {
      session.fsm.data = {};
    }
    
    session.fsm.data[key] = value;
  }

  /**
   * Clear FSM data
   */
  static clearData(session: any, key?: string): void {
    if (!session.fsm?.data) return;
    
    if (key) {
      delete session.fsm.data[key];
    } else {
      session.fsm.data = {};
    }
  }

  /**
   * Reset FSM to idle state
   */
  static reset(session: any): void {
    session.fsm = { state: BotState.IDLE };
    logger.debug('FSM State reset to IDLE');
  }

  /**
   * Check if user is in specific state
   */
  static isInState(session: any, state: BotState): boolean {
    return this.getState(session) === state;
  }

  /**
   * Check if user is in any of the provided states
   */
  static isInAnyState(session: any, states: BotState[]): boolean {
    const currentState = this.getState(session);
    return states.includes(currentState);
  }

  /**
   * Transition to next state based on current state and action
   */
  static transition(session: any, action: string, data?: Record<string, any>): BotState {
    const currentState = this.getState(session);
    let nextState = currentState;

    // Define state transitions
    switch (currentState) {
      case BotState.IDLE:
        if (action === 'start_cashback_setup') {
          nextState = BotState.SETTING_CASHBACK_BANK;
        } else if (action === 'start_favorites_add') {
          nextState = BotState.ADDING_FAVORITES_BANK;
        } else if (action === 'start_search') {
          nextState = BotState.SEARCHING;
        }
        break;

      case BotState.SETTING_CASHBACK_BANK:
        if (action === 'bank_selected') {
          nextState = BotState.SETTING_CASHBACK_CATEGORIES;
        } else if (action === 'cancel') {
          nextState = BotState.IDLE;
        }
        break;

      case BotState.SETTING_CASHBACK_CATEGORIES:
        if (action === 'categories_confirmed') {
          nextState = BotState.SETTING_CASHBACK_RATES;
        } else if (action === 'back') {
          nextState = BotState.SETTING_CASHBACK_BANK;
        } else if (action === 'cancel') {
          nextState = BotState.IDLE;
        }
        break;

      case BotState.SETTING_CASHBACK_RATES:
        if (action === 'rates_completed') {
          nextState = BotState.IDLE;
        } else if (action === 'back') {
          nextState = BotState.SETTING_CASHBACK_CATEGORIES;
        } else if (action === 'cancel') {
          nextState = BotState.IDLE;
        }
        break;

      case BotState.ADDING_FAVORITES_BANK:
        if (action === 'bank_selected') {
          nextState = BotState.ADDING_FAVORITES_CATEGORY;
        } else if (action === 'cancel') {
          nextState = BotState.IDLE;
        }
        break;

      case BotState.ADDING_FAVORITES_CATEGORY:
        if (action === 'category_selected') {
          nextState = BotState.ADDING_FAVORITES_RATE;
        } else if (action === 'back') {
          nextState = BotState.ADDING_FAVORITES_BANK;
        } else if (action === 'cancel') {
          nextState = BotState.IDLE;
        }
        break;

      case BotState.ADDING_FAVORITES_RATE:
        if (action === 'rate_completed') {
          nextState = BotState.IDLE;
        } else if (action === 'back') {
          nextState = BotState.ADDING_FAVORITES_CATEGORY;
        } else if (action === 'cancel') {
          nextState = BotState.IDLE;
        }
        break;

      case BotState.SEARCHING:
        if (action === 'search_completed') {
          nextState = BotState.IDLE;
        } else if (action === 'cancel') {
          nextState = BotState.IDLE;
        }
        break;

      case BotState.WAITING_FOR_PAYMENT:
        if (action === 'payment_completed') {
          nextState = BotState.IDLE;
        } else if (action === 'payment_failed') {
          nextState = BotState.IDLE;
        } else if (action === 'cancel') {
          nextState = BotState.IDLE;
        }
        break;
    }

    // Update state if it changed
    if (nextState !== currentState) {
      this.setState(session, nextState, data);
    }

    return nextState;
  }
}
