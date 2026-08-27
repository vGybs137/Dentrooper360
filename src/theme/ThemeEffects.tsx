import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";

import {
  applyThemeColorScheme,
  useResolvedTheme,
  useThemePreferencesStore,
} from "@/stores/themePreferencesStore";
import { getNativeColors } from "@/tokens";

export function ThemeEffects() {
  const mode = useThemePreferencesStore((state) => state.mode);
  const resolved = useResolvedTheme();

  useEffect(() => {
    applyThemeColorScheme(mode);
  }, [mode]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      getNativeColors(resolved).surface.default,
    ).catch(() => {
      // Ignore platform/runtime mismatches while keeping the app theme-aware.
    });
  }, [resolved]);

  return <StatusBar style="auto" />;
}
