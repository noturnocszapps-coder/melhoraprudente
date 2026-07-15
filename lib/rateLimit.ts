/**
 * Simple, robust Rate Limiter for Client & Server.
 * Supports sliding-window rate tracking.
 */

const inMemoryCache = new Map<string, number[]>();

interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  useLocalStorage = false
): RateLimitResult {
  const now = Date.now();
  let timestamps: number[] = [];

  if (useLocalStorage && typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(`rate_limit:${key}`);
      if (stored) {
        timestamps = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading rate limit from localStorage:', e);
    }
  } else {
    timestamps = inMemoryCache.get(key) || [];
  }

  // Filter timestamps within the current window
  const activeTimestamps = timestamps.filter(t => now - t < windowMs);

  if (activeTimestamps.length >= limit) {
    const oldestActive = activeTimestamps[0];
    const resetMs = windowMs - (now - oldestActive);
    return {
      limited: true,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    };
  }

  activeTimestamps.push(now);

  if (useLocalStorage && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(`rate_limit:${key}`, JSON.stringify(activeTimestamps));
    } catch (e) {
      console.error('Error writing rate limit to localStorage:', e);
    }
  } else {
    inMemoryCache.set(key, activeTimestamps);
  }

  return {
    limited: false,
    remaining: limit - activeTimestamps.length,
    resetMs: windowMs,
  };
}
