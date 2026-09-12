export const APP_LOCALES = ["en", "fr", "ar"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export type LocaleMode = "system" | AppLocale;

export const DEFAULT_LOCALE: AppLocale = "en";

export const RTL_LOCALES: readonly AppLocale[] = ["ar"];

export const LOCALE_DISPLAY_NAMES: Record<AppLocale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

export function isRtlLocale(locale: AppLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

/** Map BCP-47 / device language tags to a supported app locale. */
export function resolveAppLocaleFromTag(tag: string | null | undefined): AppLocale {
  if (!tag) return DEFAULT_LOCALE;
  const normalized = tag.toLowerCase().replace("_", "-");
  const primary = normalized.split("-")[0] ?? normalized;
  if (isAppLocale(primary)) return primary;
  return DEFAULT_LOCALE;
}
