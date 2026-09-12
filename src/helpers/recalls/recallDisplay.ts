import { t } from "@/i18n";

import dayjs from "dayjs";

import { hasRecallAppointment } from "@/helpers/recalls/recallKpis";

/** Whole-day difference from today (negative = past). */
export function daysFromToday(date: Date | null | undefined): number | null {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return dayjs(date).startOf("day").diff(dayjs().startOf("day"), "day");
}

export type RecallStatusLabelInput = {
  appointmentId?: string | null;
  appointmentStartTime?: Date | null;
  dueDate?: Date | null;
};

/** Human status for recall details / list pills. */
export function recallStatusLabel(recall: RecallStatusLabelInput): string {
  if (hasRecallAppointment(recall.appointmentId)) {
    const start = recall.appointmentStartTime;
    if (start && !Number.isNaN(start.getTime())) {
      const days = daysFromToday(start);
      if (days != null && days <= 0) {
        return t("recalls:status.done");
      }
    }
    return t("recalls:status.scheduled");
  }

  const due = recall.dueDate;
  if (!due || Number.isNaN(due.getTime())) {
    return t("common:empty.emDash");
  }

  if (dayjs(due).isBefore(dayjs().startOf("day"))) {
    return t("recalls:kpis.overdue");
  }

  if (dayjs(due).isSame(dayjs(), "day")) {
    return t("recalls:kpis.dueToday");
  }

  return t("recalls:status.upcoming");
}
