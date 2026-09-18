import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { PRIVACY_PREFERENCES_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/security/vault/secureStorage";

type PersistedPrivacyPreferences = {
  /** When true, obscure clinic content in the app switcher / while backgrounded. */
  hideInAppSwitcher: boolean;
};

type PrivacyPreferencesState = PersistedPrivacyPreferences & {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setHideInAppSwitcher: (value: boolean) => void;
};

const securePersistStorage: PersistStorage<PersistedPrivacyPreferences> =
  createJSONStorage<PersistedPrivacyPreferences>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

export const usePrivacyPreferencesStore = create<PrivacyPreferencesState>()(
  persist(
    (set, get) => ({
      hideInAppSwitcher: true,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setHideInAppSwitcher: (hideInAppSwitcher) => {
        if (get().hideInAppSwitcher === hideInAppSwitcher) return;
        set({ hideInAppSwitcher });
      },
    }),
    {
      name: PRIVACY_PREFERENCES_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ hideInAppSwitcher }) => ({ hideInAppSwitcher }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useHideInAppSwitcher() {
  return usePrivacyPreferencesStore((state) => state.hideInAppSwitcher);
}

export function usePrivacyPreferencesHasHydrated() {
  return usePrivacyPreferencesStore((state) => state.hasHydrated);
}
