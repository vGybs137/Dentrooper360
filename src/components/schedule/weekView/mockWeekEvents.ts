import type { MonthDayEventPreview } from "@/types/schedule";
import {
  addDays,
  parseDayKey,
  toDayKey,
  toLocalDate,
  todayCalendarDate,
  type DayKey,
} from "@/utils/calendar";

const MOCK_TYPE_COLORS = {
  checkup: "#3B82F6",
  consult: "#22C55E",
  procedure: "#EF4444",
} as const;

function eventOnDay(
  id: string,
  dayKey: DayKey,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
  title: string,
  color: string | null,
  typeName: string | null,
): MonthDayEventPreview {
  const dayStartMs = toLocalDate(parseDayKey(dayKey)).getTime();
  const startTime =
    dayStartMs + (startHour * 60 + startMinute) * 60_000;
  const endTime = dayStartMs + (endHour * 60 + endMinute) * 60_000;

  return {
    id,
    title,
    color,
    typeName,
    startTime,
    endTime,
  };
}

/** Step 6 dev data — overlapping timed mocks for the current calendar week only. */
export function getMockEventsForWeek(
  weekStartKey: DayKey,
): Record<DayKey, MonthDayEventPreview[]> {
  const todayKey = toDayKey(todayCalendarDate());
  const weekEndKey = toDayKey(addDays(parseDayKey(weekStartKey), 6));

  if (todayKey < weekStartKey || todayKey > weekEndKey) {
    return {};
  }

  const secondDayKey = toDayKey(addDays(parseDayKey(todayKey), 1));
  const events: Record<DayKey, MonthDayEventPreview[]> = {
    [todayKey]: [
      eventOnDay(
        "mock-week-1",
        todayKey,
        9,
        0,
        10,
        30,
        "Morning checkup",
        MOCK_TYPE_COLORS.checkup,
        "Checkup",
      ),
      eventOnDay(
        "mock-week-2",
        todayKey,
        9,
        30,
        11,
        0,
        "Follow-up consult",
        MOCK_TYPE_COLORS.consult,
        "Consult",
      ),
      eventOnDay(
        "mock-week-3",
        todayKey,
        14,
        0,
        15,
        0,
        "Crown prep",
        MOCK_TYPE_COLORS.procedure,
        "Procedure",
      ),
      eventOnDay(
        "mock-week-4",
        todayKey,
        14,
        30,
        16,
        0,
        "Root canal",
        MOCK_TYPE_COLORS.procedure,
        "Procedure",
      ),
    ],
  };

  if (secondDayKey <= weekEndKey) {
    events[secondDayKey] = [
      eventOnDay(
        "mock-week-5",
        secondDayKey,
        11,
        0,
        12,
        0,
        "New patient intake",
        null,
        null,
      ),
    ];
  }

  return events;
}
