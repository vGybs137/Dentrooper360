import dayjs from "dayjs";
import "dayjs/locale/ar";
import "dayjs/locale/fr";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from "@/i18n/locales";
import { namespaces, resources } from "@/i18n/resources";

const DAYJS_LOCALE: Record<AppLocale, string> = {
  en: "en",
  fr: "fr",
  ar: "ar",
};

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: ["en", "fr", "ar"],
  ns: [...namespaces],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  compatibilityJSON: "v4",
});

dayjs.locale(DAYJS_LOCALE[DEFAULT_LOCALE]);

export async function changeAppLanguage(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) return;
  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
  dayjs.locale(DAYJS_LOCALE[locale]);
}

export function t(
  key: string,
  options?: Record<string, unknown>,
): string {
  return i18n.t(key, options);
}

export function getAppLanguage(): AppLocale {
  const lng = i18n.language?.split("-")[0] ?? DEFAULT_LOCALE;
  return isAppLocale(lng) ? lng : DEFAULT_LOCALE;
}

export default i18n;
