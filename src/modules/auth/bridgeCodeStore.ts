/**
 * bridgeCodeStore.ts
 *
 * In-memory single-use bridge code store.
 * Maps opaque UUID → { accessToken, refreshToken, expiresAt }
 *
 * ⚠️  SCALE NOTE: This store lives in one serverless function instance.
 * On Vercel each invocation may hit a different cold instance, so two
 * requests could land in different instances and the code lookup would fail.
 *
 * To fix at scale: swap this Map for a Redis SETEX/GETDEL pair:
 *   await redis.set(code, JSON.stringify(payload), 'EX', 60);
 *   const raw = await redis.getDel(code);
 *
 * Upstash Redis is the simplest drop-in for Vercel serverless.
 */

interface BridgePayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix ms
}

const store = new Map<string, BridgePayload>();

const TTL_MS = 60_000; // 60 seconds

export function storeBridgeCode(code: string, payload: Omit<BridgePayload, 'expiresAt'>): void {
  store.set(code, { ...payload, expiresAt: Date.now() + TTL_MS });

  // Self-cleaning: remove expired entries lazily on each write
  for (const [k, v] of store) {
    if (v.expiresAt < Date.now()) store.delete(k);
  }
}

/**
 * Returns the payload and deletes the code in one atomic step (single-use).
 * Returns null if not found or expired.
 */
export function consumeBridgeCode(code: string): Omit<BridgePayload, 'expiresAt'> | null {
  const entry = store.get(code);
  if (!entry) return null;
  store.delete(code); // delete immediately — single-use
  if (entry.expiresAt < Date.now()) return null; // expired
  return { accessToken: entry.accessToken, refreshToken: entry.refreshToken };
}
