/**
 * Parses a schedule hour string from the API (e.g. "8:00", "08:00:00") to 0–23.
 */
export function parseScheduleHour(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value?.trim()) return fallback;

  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?/);
  if (!match) return fallback;

  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return fallback;

  return hour;
}

export function normalizeScheduleHourRange(
  startHour: number,
  endHour: number,
): { startHour: number; endHour: number } {
  const start = Math.max(0, Math.min(startHour, 23));
  const end = Math.max(start, Math.min(endHour, 23));
  return { startHour: start, endHour: end };
}
