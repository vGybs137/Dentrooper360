import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";

import {
  useIsSwitchingTheme,
  useResolvedTheme,
  useThemePreferencesStore,
} from "@/stores/themePreferencesStore";
import { getNativeColors, semantic } from "@/tokens";

export function ThemeEffects() {
  const isSwitching = useIsSwitchingTheme();
  const resolved = useResolvedTheme();

  useEffect(() => {
    if (!isSwitching) {
      return;
    }

    const startedAt = Date.now();
    const minDuration = semantic.motion.overlay.duration;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let secondFrame: number | undefined;

    const firstFrame = requestAnimationFrame(() => {
      useThemePreferencesStore.getState().commitAppliedTheme();
      secondFrame = requestAnimationFrame(() => {
        const remaining = Math.max(0, minDuration - (Date.now() - startedAt));
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            useThemePreferencesStore.getState().endThemeSwitch();
          }
        }, remaining);
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) {
        cancelAnimationFrame(secondFrame);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [isSwitching]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      getNativeColors(resolved).surface.default,
    ).catch(() => {
      // Ignore platform/runtime mismatches while keeping the app theme-aware.
    });
  }, [resolved]);

  return <StatusBar style="auto" />;
}
