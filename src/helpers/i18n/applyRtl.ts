import { I18nManager, Platform } from "react-native";

import { isRtlLocale, type AppLocale } from "@/i18n/locales";

/**
 * Aligns React Native layout direction with the active locale.
 * On native, flipping RTL after first launch often requires an app reload
 * for native views to fully remount in the new direction.
 */
export function applyRtlForLocale(locale: AppLocale): boolean {
  const shouldBeRtl = isRtlLocale(locale);
  const currentlyRtl = I18nManager.isRTL;

  I18nManager.allowRTL(true);
  I18nManager.forceRTL(shouldBeRtl);

  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.setAttribute("dir", shouldBeRtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", locale);
  }

  return shouldBeRtl !== currentlyRtl;
}
