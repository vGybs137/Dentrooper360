import { toLocalDate, type WeekdayIndex } from "@/utils/calendar";

/** Narrow weekday labels ordered from `weekStartsOn`. */
export function weekdayLabels(
  weekStartsOn: WeekdayIndex,
  locale?: string,
): string[] {
  // Jan 4 2026 is a Sunday — use it as a stable weekday anchor.
  const sunday = toLocalDate({ year: 2026, month: 0, day: 4 });
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const labels: string[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + ((weekStartsOn + i) % 7));
    labels.push(formatter.format(day));
  }

  return labels;
}
