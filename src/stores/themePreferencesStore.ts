import { colorScheme } from "nativewind";
import { Appearance, useColorScheme } from "react-native";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type PersistStorage,
} from "zustand/middleware";

import { THEME_PREFERENCES_STORE_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/helpers/auth/secureStorage";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type PersistedThemePreferences = {
  mode: ThemeMode;
};

type ThemePreferencesState = PersistedThemePreferences & {
  appliedMode: ThemeMode;
  isSwitching: boolean;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setMode: (mode: ThemeMode) => void;
  commitAppliedTheme: () => void;
  endThemeSwitch: () => void;
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
      appliedMode: "system",
      isSwitching: false,
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setMode: (mode) => {
        if (get().mode === mode) return;
        set({ mode, isSwitching: true });
      },
      commitAppliedTheme: () => {
        const mode = get().mode;
        applyThemeColorScheme(mode);
        set({ appliedMode: mode });
      },
      endThemeSwitch: () => {
        set({ isSwitching: false });
      },
    }),
    {
      name: THEME_PREFERENCES_STORE_KEY,
      storage: securePersistStorage,
      partialize: ({ mode }) => ({ mode }),
      onRehydrateStorage: () => (state) => {
        const mode = state?.mode ?? "system";
        applyThemeColorScheme(mode);
        useThemePreferencesStore.setState({
          hasHydrated: true,
          appliedMode: mode,
          isSwitching: false,
        });
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

export function useIsSwitchingTheme() {
  return useThemePreferencesStore((state) => state.isSwitching);
}

export function useResolvedTheme(): ResolvedTheme {
  const appliedMode = useThemePreferencesStore((state) => state.appliedMode);
  const systemScheme = useColorScheme();
  if (appliedMode === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  }
  return appliedMode;
}
