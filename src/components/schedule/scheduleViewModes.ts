import type { ScheduleViewMode } from "@/stores/scheduleViewModeStore";

export type ScheduleViewModeDefinition = {
  mode: ScheduleViewMode;
  label: string;
  icon: {
    ios: string;
    android: string;
    web: string;
  };
};

export const SCHEDULE_VIEW_MODES = [
  {
    mode: "month",
    label: "Month",
    icon: {
      ios: "calendar",
      android: "calendar_month",
      web: "calendar_month",
    },
  },
  {
    mode: "week",
    label: "Week",
    icon: {
      ios: "calendar.day.timeline.left",
      android: "view_week",
      web: "view_week",
    },
  },
  {
    mode: "day",
    label: "Day",
    icon: {
      ios: "calendar.day.timeline.leading",
      android: "today",
      web: "today",
    },
  },
] as const satisfies readonly ScheduleViewModeDefinition[];
