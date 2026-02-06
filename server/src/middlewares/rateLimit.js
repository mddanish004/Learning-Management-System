const buckets = new Map();

export function rateLimitByUser({ windowMs = 60000, max = 10 } = {}) {
  return (req, res, next) => {
    const key = req.user?.sub || req.ip;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now > existing.resetTime) {
      buckets.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
      res.set("Retry-After", String(Math.max(1, retryAfter)));
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    existing.count += 1;
    buckets.set(key, existing);
    return next();
  };
}
