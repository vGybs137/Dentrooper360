import { colorScheme } from "nativewind";
import { Appearance, useColorScheme } from "react-native";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { THEME_PREFERENCES_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/helpers/secureStorage";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type PersistedThemePreferences = {
  mode: ThemeMode;
};

type ThemePreferencesState = PersistedThemePreferences & {
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setMode: (mode: ThemeMode) => void;
};

const securePersistStorage: PersistStorage<PersistedThemePreferences> =
  createJSONStorage<PersistedThemePreferences>(() => ({
    getItem: (name) => getItem(name),
    setItem: (name, value) => setItem(name, value),
    removeItem: (name) => setItem(name, null),
  }))!;

export function applyThemeColorScheme(mode: ThemeMode) {
  colorScheme.set(mode);
  Appearance.setColorScheme(mode === "system" ? "unspecified" : mode);
}

export const useThemePreferencesStore = create<ThemePreferencesState>()(
  persist(
    (set, get) => ({
      mode: "system",
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setMode: (mode) => {
        if (get().mode === mode) return;
        set({ mode });
        applyThemeColorScheme(mode);
      },
    }),
    {
      name: THEME_PREFERENCES_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ mode }) => ({ mode }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        applyThemeColorScheme(state?.mode ?? "system");
      },
    },
  ),
);

export function useThemeMode() {
  return useThemePreferencesStore((state) => state.mode);
}

export function useThemePreferencesHasHydrated() {
  return useThemePreferencesStore((state) => state.hasHydrated);
}

export function useResolvedTheme(): ResolvedTheme {
  const mode = useThemePreferencesStore((state) => state.mode);
  const systemScheme = useColorScheme();
  if (mode === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return mode;
}
