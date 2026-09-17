export const APP_LOCK_TIMEOUT_IMMEDIATE_MS = 0;
export const APP_LOCK_TIMEOUT_5_MIN_MS = 5 * 60 * 1000;
export const APP_LOCK_TIMEOUT_15_MIN_MS = 15 * 60 * 1000;
export const DEFAULT_APP_LOCK_TIMEOUT_MS = APP_LOCK_TIMEOUT_5_MIN_MS;

export const APP_LOCK_TIMEOUTS = [
  APP_LOCK_TIMEOUT_IMMEDIATE_MS,
  APP_LOCK_TIMEOUT_5_MIN_MS,
  APP_LOCK_TIMEOUT_15_MIN_MS,
] as const;

export type AppLockTimeoutMs = (typeof APP_LOCK_TIMEOUTS)[number];

/**
 * Lock when app lock is on and there is no recent unlock, or the idle window
 * has elapsed. Timeout 0 locks on any completed idle interval, including a
 * just-recorded background timestamp.
 */
export function shouldLockSession(
  enabled: boolean,
  lastUnlockedAt: number | null,
  now: number,
  timeoutMs: number,
): boolean {
  if (!enabled) {
    return false;
  }

  if (lastUnlockedAt == null) {
    return true;
  }

  return now - lastUnlockedAt >= timeoutMs;
}

export function isAppLockTimeoutMs(value: number): value is AppLockTimeoutMs {
  return (APP_LOCK_TIMEOUTS as readonly number[]).includes(value);
}
