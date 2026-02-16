import DodoPayments from 'dodopayments';

const VALID_ENVIRONMENTS = new Set(['test_mode', 'live_mode']);

let cachedClient = null;

function getDodoEnvironment() {
  const configured = process.env.DODO_PAYMENTS_ENVIRONMENT;
  if (VALID_ENVIRONMENTS.has(configured)) {
    return configured;
  }
  return 'test_mode';
}

export function getDodoPaymentsClient() {
  if (cachedClient) {
    return cachedClient;
  }

  if (!process.env.DODO_PAYMENTS_API_KEY) {
    throw new Error('DODO_PAYMENTS_API_KEY is not configured');
  }

  cachedClient = new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    environment: getDodoEnvironment(),
  });

  return cachedClient;
}

export function getDodoWebhookKey() {
  if (!process.env.DODO_PAYMENTS_WEBHOOK_KEY) {
    throw new Error('DODO_PAYMENTS_WEBHOOK_KEY is not configured');
  }

  return process.env.DODO_PAYMENTS_WEBHOOK_KEY;
}
