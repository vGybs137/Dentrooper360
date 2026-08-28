export type SurfaceTone =
  "default" | "sunken" | "raised" | "overlay" | "inverse";
export type ForegroundTone = "default" | "muted" | "inverse";
export type BorderTone = "subtle" | "default" | "strong" | "focus";
export type AccentTone = "default" | "subtle" | "strong" | "text";
export type StatusTone = "DEFAULT" | "subtle" | "strong" | "text";
/** In-month vs out-of-month day cell backgrounds, plus month quick-add field. */
export type CalendarTone = "default" | "muted" | "quickAdd";

export type ThemePalette = {
  surface: Record<SurfaceTone, string>;
  foreground: Record<ForegroundTone, string>;
  border: Record<BorderTone, string>;
  brand: Record<AccentTone, string>;
  accent: Record<AccentTone, string>;
  success: Record<StatusTone, string>;
  alert: Record<StatusTone, string>;
  calendar: Record<CalendarTone, string>;
};

export const lightPalette: ThemePalette;
export const darkPalette: ThemePalette;
export const themePalettes: {
  light: ThemePalette;
  dark: ThemePalette;
};
