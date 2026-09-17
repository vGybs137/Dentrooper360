import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { APP_LOCK_STORE_KEY } from "@/constants/storage";
import {
  DEFAULT_APP_LOCK_TIMEOUT_MS,
  isAppLockTimeoutMs,
  type AppLockTimeoutMs,
} from "@/security/biometric/shouldLockSession";
import { getItem, setItem } from "@/security/vault/secureStorage";

type PersistedAppLock = {
  enabled: boolean;
  timeoutMs: AppLockTimeoutMs;
};

type AppLockState = PersistedAppLock & {
  hasHydrated: boolean;
  isLocked: boolean;
  lastUnlockedAt: number | null;
  backgroundedAt: number | null;
  passwordFallback: boolean;
  setHasHydrated: (value: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setTimeoutMs: (timeoutMs: AppLockTimeoutMs) => void;
  lock: () => void;
  markUnlocked: () => void;
  setBackgroundedAt: (value: number | null) => void;
  requestPasswordFallback: () => void;
};

const securePersistStorage: PersistStorage<PersistedAppLock> =
  createJSONStorage<PersistedAppLock>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

export const useAppLockStore = create<AppLockState>()(
  persist(
    (set) => ({
      enabled: false,
      timeoutMs: DEFAULT_APP_LOCK_TIMEOUT_MS,
      hasHydrated: false,
      isLocked: false,
      lastUnlockedAt: null,
      backgroundedAt: null,
      passwordFallback: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setEnabled: (enabled) =>
        set(enabled ? { enabled } : { enabled, isLocked: false }),
      setTimeoutMs: (timeoutMs) => set({ timeoutMs }),
      lock: () => set({ isLocked: true, passwordFallback: false }),
      markUnlocked: () =>
        set({
          isLocked: false,
          passwordFallback: false,
          lastUnlockedAt: Date.now(),
          backgroundedAt: null,
        }),
      setBackgroundedAt: (backgroundedAt) => set({ backgroundedAt }),
      requestPasswordFallback: () => set({ passwordFallback: true }),
    }),
    {
      name: APP_LOCK_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ enabled, timeoutMs }) => ({ enabled, timeoutMs }),
      onRehydrateStorage: () => (state) => {
        const timeoutMs = state?.timeoutMs;
        useAppLockStore.setState({
          hasHydrated: true,
          timeoutMs:
            timeoutMs != null && isAppLockTimeoutMs(timeoutMs)
              ? timeoutMs
              : DEFAULT_APP_LOCK_TIMEOUT_MS,
        });
      },
    },
  ),
);

export function useAppLockHasHydrated() {
  return useAppLockStore((state) => state.hasHydrated);
}

export function markAppUnlocked() {
  useAppLockStore.getState().markUnlocked();
}

export function lockApp() {
  useAppLockStore.getState().lock();
}
