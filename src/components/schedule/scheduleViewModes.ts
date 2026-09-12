import type { ScheduleViewMode } from "@/stores/scheduleViewModeStore";

export type ScheduleViewModeDefinition = {
  mode: ScheduleViewMode;
  labelKey: string;
  icon: {
    ios: string;
    android: string;
    web: string;
  };
};

export const SCHEDULE_VIEW_MODES = [
  {
    mode: "month",
    labelKey: "navigation:schedule.view.month",
    icon: {
      ios: "calendar",
      android: "calendar_month",
      web: "calendar_month",
    },
  },
  {
    mode: "week",
    labelKey: "navigation:schedule.view.week",
    icon: {
      ios: "calendar.day.timeline.left",
      android: "view_week",
      web: "view_week",
    },
  },
  {
    mode: "day",
    labelKey: "navigation:schedule.view.day",
    icon: {
      ios: "calendar.day.timeline.leading",
      android: "today",
      web: "today",
    },
  },
] as const satisfies readonly ScheduleViewModeDefinition[];
