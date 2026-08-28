import { useResolvedTheme } from "@/stores/themePreferencesStore";
import { getNativeColors, type ThemePalette } from "@/tokens";

export function useNativeColors(): ThemePalette {
  return getNativeColors(useResolvedTheme());
}
