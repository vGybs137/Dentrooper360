import { getLocales } from "expo-localization";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { LOCALE_PREFERENCES_STORE_KEY } from "@/constants/storage";
import { applyRtlForLocale } from "@/helpers/i18n/applyRtl";
import { getItem, setItem } from "@/security/vault/secureStorage";
import { changeAppLanguage } from "@/i18n";
import {
  DEFAULT_LOCALE,
  resolveAppLocaleFromTag,
  type AppLocale,
  type LocaleMode,
} from "@/i18n/locales";

export type { AppLocale, LocaleMode };

type PersistedLocalePreferences = {
  mode: LocaleMode;
};

type LocalePreferencesState = PersistedLocalePreferences & {
  resolvedLocale: AppLocale;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setMode: (mode: LocaleMode) => void;
  resolveAndApply: () => AppLocale;
};

const securePersistStorage: PersistStorage<PersistedLocalePreferences> =
  createJSONStorage<PersistedLocalePreferences>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

export function getDeviceLocale(): AppLocale {
  const tag = getLocales()[0]?.languageTag ?? getLocales()[0]?.languageCode;
  return resolveAppLocaleFromTag(tag);
}

export function resolveLocaleFromMode(mode: LocaleMode): AppLocale {
  if (mode === "system") return getDeviceLocale();
  return mode;
}

function applyLocale(locale: AppLocale) {
  void changeAppLanguage(locale);
  applyRtlForLocale(locale);
}

export const useLocalePreferencesStore = create<LocalePreferencesState>()(
  persist(
    (set, get) => ({
      mode: "system",
      resolvedLocale: DEFAULT_LOCALE,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setMode: (mode) => {
        if (get().mode === mode) return;
        const resolvedLocale = resolveLocaleFromMode(mode);
        set({ mode, resolvedLocale });
        applyLocale(resolvedLocale);
      },
      resolveAndApply: () => {
        const resolvedLocale = resolveLocaleFromMode(get().mode);
        set({ resolvedLocale });
        applyLocale(resolvedLocale);
        return resolvedLocale;
      },
    }),
    {
      name: LOCALE_PREFERENCES_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ mode }) => ({ mode }),
      onRehydrateStorage: () => (state) => {
        const mode = state?.mode ?? "system";
        const resolvedLocale = resolveLocaleFromMode(mode);
        applyLocale(resolvedLocale);
        useLocalePreferencesStore.setState({
          hasHydrated: true,
          mode,
          resolvedLocale,
        });
      },
    },
  ),
);

export function useLocaleMode() {
  return useLocalePreferencesStore((state) => state.mode);
}

export function useResolvedLocale(): AppLocale {
  return useLocalePreferencesStore((state) => state.resolvedLocale);
}

export function useLocalePreferencesHasHydrated() {
  return useLocalePreferencesStore((state) => state.hasHydrated);
}

export function getResolvedLocale(): AppLocale {
  return useLocalePreferencesStore.getState().resolvedLocale;
}
