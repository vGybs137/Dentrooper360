import dayjs from "dayjs";

import { t } from "@/i18n";
import { getResolvedLocale } from "@/stores/localePreferencesStore";

export function formatLastSyncedAt(timestamp: number | null): string {
  if (timestamp == null) {
    return t("sync:lastSynced.never");
  }

  const locale = getResolvedLocale();
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(dayjs(timestamp).toDate());
}
