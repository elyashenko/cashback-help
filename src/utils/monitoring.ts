import { Counter, Histogram, register } from 'prom-client';

export const metrics = {
  queriesTotal: new Counter({
    name: 'bot_queries_total',
    help: 'Total number of queries processed',
    labelNames: ['query_type', 'status'],
  }),

  queryDuration: new Histogram({
    name: 'bot_query_duration_seconds',
    help: 'Query processing duration',
    labelNames: ['query_type'],
    buckets: [0.1, 0.5, 1, 2, 5],
  }),

  subscriptionsTotal: new Counter({
    name: 'bot_subscriptions_total',
    help: 'Total subscriptions created',
    labelNames: ['type'],
  }),

  paymentsTotal: new Counter({
    name: 'bot_payments_total',
    help: 'Total payments processed',
    labelNames: ['status'],
  }),

  activeUsers: new Counter({
    name: 'bot_active_users_total',
    help: 'Total active users',
  }),

  errorsTotal: new Counter({
    name: 'bot_errors_total',
    help: 'Total errors encountered',
    labelNames: ['type'],
  }),
};

export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

