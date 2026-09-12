import type { HourFormat } from "@/stores/schedulePreferencesStore";
import { useSchedulePreferencesStore } from "@/stores/schedulePreferencesStore";
import { getResolvedLocale } from "@/stores/localePreferencesStore";

function resolveHourFormat(hourFormat?: HourFormat): HourFormat {
  return hourFormat ?? useSchedulePreferencesStore.getState().hourFormat;
}

/** Locale that matches the preferred clock cycle for native pickers. */
export function hourFormatLocale(hourFormat?: HourFormat): string {
  return resolveHourFormat(hourFormat) === "24h" ? "en-GB" : "en-US";
}

/** BCP-47 tag for Intl when an explicit locale is omitted. */
function resolveIntlLocale(locale?: string): string {
  return locale ?? getResolvedLocale();
}

/** dayjs pattern for a clock time (no date). */
export function dayjsTimePattern(hourFormat?: HourFormat): string {
  return resolveHourFormat(hourFormat) === "24h" ? "HH:mm" : "h:mm A";
}

/** dayjs pattern for date + clock time. */
export function dayjsDateTimePattern(hourFormat?: HourFormat): string {
  return resolveHourFormat(hourFormat) === "24h"
    ? "D MMM, HH:mm"
    : "D MMM, h:mm A";
}

export function formatClockTime(
  value: Date | number,
  hourFormat?: HourFormat,
  locale?: string,
): string {
  const format = resolveHourFormat(hourFormat);
  const date = typeof value === "number" ? new Date(value) : value;
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    hour: "numeric",
    minute: "2-digit",
    hour12: format === "12h",
  }).format(date);
}

/** Hour-only label for timed-grid gutters (e.g. "9 AM" / "09"). */
export function formatHourLabel(
  hour: number,
  hourFormat?: HourFormat,
  locale?: string,
): string {
  const format = resolveHourFormat(hourFormat);
  const anchor = new Date(2000, 0, 1, hour, 0, 0, 0);
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    hour: "numeric",
    hour12: format === "12h",
  })
    .format(anchor)
    .replace(/\s/g, "");
}

export function formatTimeRange(
  startMs: number,
  endMs: number,
  hourFormat?: HourFormat,
  locale?: string,
): string {
  const format = resolveHourFormat(hourFormat);
  const resolvedLocale = resolveIntlLocale(locale);
  const formatter = new Intl.DateTimeFormat(resolvedLocale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: format === "12h",
  });
  return `${formatter.format(new Date(startMs))} – ${formatter.format(new Date(endMs))}`;
}
