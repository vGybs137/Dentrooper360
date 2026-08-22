import { DayCalendar } from "@/components/schedule/dayView";
import { MonthCalendar } from "@/components/schedule/monthView";
import { WeekCalendar } from "@/components/schedule/weekView";
import { Screen } from "@/components/ui";
import { useScheduleViewModeStore } from "@/stores/scheduleViewModeStore";
import { useThemeTokens } from "@/theme";

/** Flip to true to preview the day view shell (Step 3 — replaced by view toggle in Step 7). */
const PREVIEW_DAY_VIEW = true;

/** Full-screen schedule with Month | Week calendar views. */
export default function ScheduleScreen() {
  const theme = useThemeTokens();
  const viewMode = useScheduleViewModeStore((state) => state.viewMode);

  return (
    <Screen
      edges={["top", "left", "right"]}
      inset="compact"
      padBottom={false}
      bottomInset={theme.semantic.space.stack.compact}
      scroll={false}
      style={{ backgroundColor: theme.palette.surface.default }}
    >
      {PREVIEW_DAY_VIEW ? (
        <DayCalendar />
      ) : viewMode === "week" ? (
        <WeekCalendar weekStartsOn={1} />
      ) : (
        <MonthCalendar weekStartsOn={1} />
      )}
    </Screen>
  );
}
