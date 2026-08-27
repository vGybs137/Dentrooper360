import { themePalettes, type ThemePalette } from "./colors";

export type NativeColorScheme = keyof typeof themePalettes;

/** Hex palettes for native APIs that cannot take a className. */
export function getNativeColors(resolved: NativeColorScheme): ThemePalette {
  return themePalettes[resolved];
}
