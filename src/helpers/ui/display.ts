import dayjs from "dayjs";

import { t } from "@/i18n";

/** Display date as `D MMM, YYYY`, or empty placeholder when missing/invalid. */
export function formatDisplayDate(
  value: Date | null | undefined,
  emptyLabel?: string,
): { value: string; empty: boolean } {
  const resolvedEmpty = emptyLabel ?? t("common:empty.notSet");
  if (!value || Number.isNaN(value.getTime())) {
    return { value: resolvedEmpty, empty: true };
  }

  return { value: dayjs(value).format("D MMM, YYYY"), empty: false };
}

/** Trimmed string display, or empty placeholder when blank. */
export function displayOrEmpty(
  value: string | null | undefined,
  emptyLabel: string,
): { value: string; empty: boolean } {
  const trimmed = value?.trim();
  if (!trimmed) {
    return { value: emptyLabel, empty: true };
  }

  return { value: trimmed, empty: false };
}
