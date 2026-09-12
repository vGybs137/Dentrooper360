import { I18nManager } from "react-native";

import { chevronLeftIcon, chevronRightIcon } from "@/constants/icons";
import { getResolvedLocale } from "@/stores/localePreferencesStore";

function isAppRtl(): boolean {
  return I18nManager.isRTL || getResolvedLocale() === "ar";
}

/** Back chevron that points toward the start edge in LTR/RTL. */
export function navBackChevronIcon() {
  return isAppRtl() ? chevronRightIcon : chevronLeftIcon;
}

/** Forward/disclosure chevron that points toward the end edge in LTR/RTL. */
export function navForwardChevronIcon() {
  return isAppRtl() ? chevronLeftIcon : chevronRightIcon;
}
