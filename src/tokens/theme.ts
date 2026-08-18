import { primitives } from "./primitives";
import { semantic } from "./semantic";
import { themePalettes, type ThemePalette } from "./palette";

export type ResolvedTheme = keyof typeof themePalettes;

export type RuntimeTheme = {
  name: ResolvedTheme;
  palette: ThemePalette;
  primitives: typeof primitives;
  semantic: typeof semantic;
  colorScheme: ResolvedTheme;
  colors: {
    background: string;
    backgroundSunken: string;
    backgroundRaised: string;
    backgroundOverlay: string;
    text: string;
    textMuted: string;
    textInverse: string;
    border: string;
    borderSubtle: string;
    borderStrong: string;
    focus: string;
    brand: string;
    brandSubtle: string;
    brandStrong: string;
    brandText: string;
    accent: string;
    accentSubtle: string;
    accentStrong: string;
    accentText: string;
    success: string;
    successSubtle: string;
    successStrong: string;
    successText: string;
    alert: string;
    alertSubtle: string;
    alertStrong: string;
    alertText: string;
  };
};

function createRuntimeTheme(
  name: ResolvedTheme,
  palette: ThemePalette
): RuntimeTheme {
  return {
    name,
    palette,
    primitives,
    semantic,
    colorScheme: name,
    colors: {
      background: palette.surface.default,
      backgroundSunken: palette.surface.sunken,
      backgroundRaised: palette.surface.raised,
      backgroundOverlay: palette.surface.overlay,
      text: palette.foreground.default,
      textMuted: palette.foreground.muted,
      textInverse: palette.foreground.inverse,
      border: palette.border.default,
      borderSubtle: palette.border.subtle,
      borderStrong: palette.border.strong,
      focus: palette.border.focus,
      brand: palette.brand.default,
      brandSubtle: palette.brand.subtle,
      brandStrong: palette.brand.strong,
      brandText: palette.brand.text,
      accent: palette.accent.default,
      accentSubtle: palette.accent.subtle,
      accentStrong: palette.accent.strong,
      accentText: palette.accent.text,
      success: palette.success.DEFAULT,
      successSubtle: palette.success.subtle,
      successStrong: palette.success.strong,
      successText: palette.success.text,
      alert: palette.alert.DEFAULT,
      alertSubtle: palette.alert.subtle,
      alertStrong: palette.alert.strong,
      alertText: palette.alert.text,
    },
  };
}

export const runtimeThemes = {
  light: createRuntimeTheme("light", themePalettes.light),
  dark: createRuntimeTheme("dark", themePalettes.dark),
} as const;

export function getRuntimeTheme(resolvedTheme: ResolvedTheme): RuntimeTheme {
  return runtimeThemes[resolvedTheme];
}
