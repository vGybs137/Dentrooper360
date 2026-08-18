export type SurfaceTone = "default" | "sunken" | "raised" | "overlay" | "inverse";
export type ForegroundTone = "default" | "muted" | "inverse";
export type BorderTone = "subtle" | "default" | "strong" | "focus";
export type AccentTone = "default" | "subtle" | "strong" | "text";
export type StatusTone = "DEFAULT" | "subtle" | "strong" | "text";

export type ThemePalette = {
  surface: Record<SurfaceTone, string>;
  foreground: Record<ForegroundTone, string>;
  border: Record<BorderTone, string>;
  brand: Record<AccentTone, string>;
  accent: Record<AccentTone, string>;
  success: Record<StatusTone, string>;
  alert: Record<StatusTone, string>;
};

export const lightPalette: ThemePalette = {
  surface: {
    default: "#ffffff",
    sunken: "#f4f4f5",
    raised: "#ffffff",
    overlay: "#ffffff",
    inverse: "#18181b",
  },
  foreground: {
    default: "#18181b",
    muted: "#71717a",
    inverse: "#fafafa",
  },
  border: {
    subtle: "#e4e4e7",
    default: "#d4d4d8",
    strong: "#a1a1aa",
    focus: "#0a9e91",
  },
  brand: {
    default: "#0a9e91",
    subtle: "rgba(10, 158, 145, 0.12)",
    strong: "#06796f",
    text: "#ffffff",
  },
  accent: {
    default: "#1d4ed8",
    subtle: "rgba(29, 78, 216, 0.12)",
    strong: "#1e40af",
    text: "#ffffff",
  },
  success: {
    DEFAULT: "#16a34a",
    subtle: "rgba(22, 163, 74, 0.12)",
    strong: "#15803d",
    text: "#ffffff",
  },
  alert: {
    DEFAULT: "#ef4444",
    subtle: "rgba(239, 68, 68, 0.12)",
    strong: "#dc2626",
    text: "#ffffff",
  },
};

export const darkPalette: ThemePalette = {
  surface: {
    default: "#0b0f10",
    sunken: "#0f1517",
    raised: "#111827",
    overlay: "#0b0f10",
    inverse: "#fafafa",
  },
  foreground: {
    default: "#e5e7eb",
    muted: "#9ca3af",
    inverse: "#0b0f10",
  },
  border: {
    subtle: "#27303a",
    default: "#334155",
    strong: "#475569",
    focus: "#0a9e91",
  },
  brand: {
    default: "#0a9e91",
    subtle: "rgba(10, 158, 145, 0.18)",
    strong: "#06796f",
    text: "#ffffff",
  },
  accent: {
    default: "#1d4ed8",
    subtle: "rgba(29, 78, 216, 0.18)",
    strong: "#1e40af",
    text: "#ffffff",
  },
  success: {
    DEFAULT: "#16a34a",
    subtle: "rgba(22, 163, 74, 0.18)",
    strong: "#15803d",
    text: "#ffffff",
  },
  alert: {
    DEFAULT: "#ef4444",
    subtle: "rgba(239, 68, 68, 0.18)",
    strong: "#dc2626",
    text: "#ffffff",
  },
};

export const themePalettes = {
  light: lightPalette,
  dark: darkPalette,
} as const;
