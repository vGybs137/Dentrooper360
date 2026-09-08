import dayjs, { type Dayjs } from "dayjs";

import {
  addDays,
  parseDayKey,
  toDayKey,
  toLocalDate,
  weekStartDayKey,
  type WeekdayIndex,
} from "@/helpers/schedule/calendar";

export type RecallDueBucket = "overdue" | "dueToday" | "dueThisWeek" | "later";

export type RecallDueInput = {
  dueDate: Date;
  /** Linked appointment id; overdue only when missing after the due date. */
  appointmentId?: string | null;
};

export type RecallListKpis = {
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  /** Overdue / total active recalls, rounded percent; null when total is 0. */
  overdueRatioPercent: number | null;
  total: number;
};

export const EMPTY_RECALL_LIST_KPIS: RecallListKpis = {
  overdue: 0,
  dueToday: 0,
  dueThisWeek: 0,
  overdueRatioPercent: null,
  total: 0,
};

export type RecallDueBounds = {
  todayStart: Dayjs;
  tomorrowStart: Dayjs;
  weekEndExclusive: Dayjs;
};

export function getRecallDueBounds(
  referenceDate: Dayjs = dayjs(),
  weekStartsOn: WeekdayIndex = 1,
): RecallDueBounds {
  const todayStart = referenceDate.startOf("day");
  const tomorrowStart = todayStart.add(1, "day");
  const todayKey = toDayKey(todayStart.toDate());
  const weekStartKey = weekStartDayKey(todayKey, weekStartsOn);
  const weekEndExclusive = dayjs(
    toLocalDate(addDays(parseDayKey(weekStartKey), 7)),
  ).startOf("day");

  return { todayStart, tomorrowStart, weekEndExclusive };
}

export function hasRecallAppointment(
  appointmentId: string | null | undefined,
): boolean {
  return Boolean(appointmentId?.trim());
}

/**
 * Overdue = due date has passed and the recall has no linked appointment.
 * Past-due recalls with an appointment are treated as handled (`later`).
 */
export function classifyRecallDueDate(
  dueDate: Date | null | undefined,
  bounds: RecallDueBounds,
  appointmentId?: string | null,
): RecallDueBucket | null {
  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return null;
  }

  const due = dayjs(dueDate);
  if (due.isBefore(bounds.todayStart)) {
    return hasRecallAppointment(appointmentId) ? "later" : "overdue";
  }
  if (due.isBefore(bounds.tomorrowStart)) {
    return "dueToday";
  }
  if (due.isBefore(bounds.weekEndExclusive)) {
    return "dueThisWeek";
  }
  return "later";
}

export function computeRecallListKpis(
  recalls: RecallDueInput[],
  referenceDate: Dayjs = dayjs(),
  weekStartsOn: WeekdayIndex = 1,
): RecallListKpis {
  const bounds = getRecallDueBounds(referenceDate, weekStartsOn);
  let overdue = 0;
  let dueToday = 0;
  let dueThisWeek = 0;

  for (const recall of recalls) {
    const bucket = classifyRecallDueDate(
      recall.dueDate,
      bounds,
      recall.appointmentId,
    );
    if (bucket === "overdue") {
      overdue += 1;
    } else if (bucket === "dueToday") {
      dueToday += 1;
    } else if (bucket === "dueThisWeek") {
      dueThisWeek += 1;
    }
  }

  const total = recalls.length;

  return {
    overdue,
    dueToday,
    dueThisWeek,
    overdueRatioPercent:
      total === 0 ? null : Math.round((overdue / total) * 100),
    total,
  };
}

/** Sort by urgency: overdue → due today → this week → later, then by due date. */
export function compareRecallsByUrgency(
  a: RecallDueInput,
  b: RecallDueInput,
  bounds: RecallDueBounds,
): number {
  const bucketOrder: Record<RecallDueBucket, number> = {
    overdue: 0,
    dueToday: 1,
    dueThisWeek: 2,
    later: 3,
  };

  const aBucket =
    classifyRecallDueDate(a.dueDate, bounds, a.appointmentId) ?? "later";
  const bBucket =
    classifyRecallDueDate(b.dueDate, bounds, b.appointmentId) ?? "later";

  if (aBucket !== bBucket) {
    return bucketOrder[aBucket] - bucketOrder[bBucket];
  }

  return a.dueDate.getTime() - b.dueDate.getTime();
}
