import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";

import { getRuntimeTheme, type RuntimeTheme } from "@/tokens";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  theme: RuntimeTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const systemResolved: ResolvedTheme =
    systemScheme === "dark" ? "dark" : "light";

  const [mode, setMode] = useState<ThemeMode>("system");

  // Drive appearance (and NativeWind dark mode) centrally.
  useEffect(() => {
    const nextScheme = mode === "system" ? "unspecified" : mode;
    Appearance.setColorScheme(nextScheme);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved: ResolvedTheme = mode === "system" ? systemResolved : mode;
    const theme = getRuntimeTheme(resolved);
    return { mode, resolved, theme, setMode };
  }, [mode, systemResolved]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(value.theme.colors.background).catch(() => {
      // Ignore platform/runtime mismatches while keeping the app theme-aware.
    });
  }, [value.theme.colors.background]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return value;
}

export function useThemeTokens(): RuntimeTheme {
  return useAppTheme().theme;
}
