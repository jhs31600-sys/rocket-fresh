'use strict';

const buckets = globalThis.__freshfillRateBuckets || new Map();
globalThis.__freshfillRateBuckets = buckets;

function consumeRateLimit(key, options = {}) {
  const limit = options.limit || 8;
  const windowMs = options.windowMs || 60_000;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    cleanOccasionally(now);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt
  };
}

function cleanOccasionally(now) {
  if (buckets.size < 500) return;
  for (const [key, value] of buckets) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}

module.exports = { consumeRateLimit };
