import { useResolvedTheme } from "@/stores/themePreferencesStore";
import {
  getNativeColors,
  getRuntimeTheme,
  type RuntimeTheme,
  type ThemePalette,
} from "@/tokens";

export function useNativeColors(): ThemePalette {
  return getNativeColors(useResolvedTheme());
}

export function useThemeTokens(): RuntimeTheme {
  return getRuntimeTheme(useResolvedTheme());
}
