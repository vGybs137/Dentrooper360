import type { AppLocale } from "@/i18n/locales";

export type LocalizedNameFields = {
  nameEn?: string | null;
  nameAr?: string | null;
  nameFr?: string | null;
};

export type LocalizedServiceNameFields = {
  serviceNameEn?: string | null;
  serviceNameAr?: string | null;
  serviceNameFr?: string | null;
};

function firstNonEmpty(
  ...values: Array<string | null | undefined>
): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Prefer the active locale's name, then English, then any remaining locale. */
export function pickLocalizedName(
  record: LocalizedNameFields | null | undefined,
  locale: AppLocale,
  fallback = "",
): string {
  if (!record) return fallback;
  const { nameEn, nameAr, nameFr } = record;
  if (locale === "ar") {
    return firstNonEmpty(nameAr, nameEn, nameFr) ?? fallback;
  }
  if (locale === "fr") {
    return firstNonEmpty(nameFr, nameEn, nameAr) ?? fallback;
  }
  return firstNonEmpty(nameEn, nameFr, nameAr) ?? fallback;
}

export function pickLocalizedServiceName(
  record: LocalizedServiceNameFields | null | undefined,
  locale: AppLocale,
  fallback = "",
): string {
  if (!record) return fallback;
  const { serviceNameEn, serviceNameAr, serviceNameFr } = record;
  if (locale === "ar") {
    return firstNonEmpty(serviceNameAr, serviceNameEn, serviceNameFr) ?? fallback;
  }
  if (locale === "fr") {
    return firstNonEmpty(serviceNameFr, serviceNameEn, serviceNameAr) ?? fallback;
  }
  return firstNonEmpty(serviceNameEn, serviceNameFr, serviceNameAr) ?? fallback;
}
