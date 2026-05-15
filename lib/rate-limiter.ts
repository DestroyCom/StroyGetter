const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const buckets = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (buckets.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) return true;
  timestamps.push(now);
  buckets.set(ip, timestamps);
  return false;
}
