import dayjs from "dayjs";

/** Display date as `D MMM, YYYY`, or empty placeholder when missing/invalid. */
export function formatDisplayDate(
  value: Date | null | undefined,
  emptyLabel = "Not set",
): { value: string; empty: boolean } {
  if (!value || Number.isNaN(value.getTime())) {
    return { value: emptyLabel, empty: true };
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
