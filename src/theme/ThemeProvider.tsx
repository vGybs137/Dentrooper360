import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const systemResolved: ResolvedTheme = systemScheme === "dark" ? "dark" : "light";

  const [mode, setMode] = useState<ThemeMode>("system");

  // Drive appearance (and NativeWind dark mode) centrally.
  useEffect(() => {
    const nextScheme = mode === "system" ? null : mode;
    Appearance.setColorScheme(nextScheme);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved: ResolvedTheme = mode === "system" ? systemResolved : mode;
    return { mode, resolved, setMode };
  }, [mode, systemResolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return value;
}

