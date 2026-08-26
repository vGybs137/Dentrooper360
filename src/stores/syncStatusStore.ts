import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { SYNC_STATUS_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/helpers/secureStorage";

type PersistedSyncStatusState = {
  lastSuccessfulSyncAt: number | null;
  /** When true, sync is blocked on cellular / mobile data. */
  syncWifiOnly: boolean;
};

type SyncStatusStoreState = PersistedSyncStatusState & {
  hasHydrated: boolean;
  isOfflineMode: boolean;
  setHasHydrated: (value: boolean) => void;
  setOfflineMode: (value: boolean) => void;
  setSyncWifiOnly: (value: boolean) => void;
  markSyncSucceeded: (at?: number) => void;
  clearSyncStatus: () => void;
  canEnterOffline: () => boolean;
};

const securePersistStorage: PersistStorage<PersistedSyncStatusState> =
  createJSONStorage<PersistedSyncStatusState>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

export const useSyncStatusStore = create<SyncStatusStoreState>()(
  persist(
    (set, get) => ({
      lastSuccessfulSyncAt: null,
      syncWifiOnly: false,
      hasHydrated: false,
      isOfflineMode: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setOfflineMode: (value) => set({ isOfflineMode: value }),
      setSyncWifiOnly: (syncWifiOnly) => {
        if (get().syncWifiOnly === syncWifiOnly) return;
        set({ syncWifiOnly });
      },
      markSyncSucceeded: (at = Date.now()) =>
        set({
          lastSuccessfulSyncAt: at,
          isOfflineMode: false,
        }),
      clearSyncStatus: () =>
        set({
          lastSuccessfulSyncAt: null,
          isOfflineMode: false,
        }),
      canEnterOffline: () => get().lastSuccessfulSyncAt != null,
    }),
    {
      name: SYNC_STATUS_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ lastSuccessfulSyncAt, syncWifiOnly }) => ({
        lastSuccessfulSyncAt,
        syncWifiOnly,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

let hydrationPromise: Promise<void> | null = null;

export async function hydrateSyncStatusStore(): Promise<void> {
  if (useSyncStatusStore.persist.hasHydrated()) {
    return;
  }

  if (!hydrationPromise) {
    hydrationPromise = Promise.resolve(useSyncStatusStore.persist.rehydrate())
      .then(() => undefined)
      .finally(() => {
        hydrationPromise = null;
      });
  }

  await hydrationPromise;
}

export function markSyncSucceeded(at?: number): void {
  useSyncStatusStore.getState().markSyncSucceeded(at);
}

export function setOfflineMode(value: boolean): void {
  useSyncStatusStore.getState().setOfflineMode(value);
}

export function canEnterOffline(): boolean {
  return useSyncStatusStore.getState().canEnterOffline();
}

export function clearSyncStatus(): void {
  useSyncStatusStore.getState().clearSyncStatus();
}

export function useLastSuccessfulSyncAt() {
  return useSyncStatusStore((state) => state.lastSuccessfulSyncAt);
}

export function useIsOfflineMode() {
  return useSyncStatusStore((state) => state.isOfflineMode);
}

export function useSyncWifiOnly() {
  return useSyncStatusStore((state) => state.syncWifiOnly);
}

export function useCanEnterOffline() {
  return useSyncStatusStore((state) => state.lastSuccessfulSyncAt != null);
}

export function useSyncStatusHasHydrated() {
  return useSyncStatusStore((state) => state.hasHydrated);
}
