import { randomUUID } from 'crypto';

export function attachCorrelationId(req, res, next) {
  const headerValue = req.headers['x-correlation-id'];
  const correlationId = typeof headerValue === 'string' && headerValue.trim()
    ? headerValue.trim()
    : randomUUID();

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  next();
}
