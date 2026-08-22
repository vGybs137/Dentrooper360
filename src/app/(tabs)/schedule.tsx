import { MonthCalendar } from "@/components/schedule/monthView";
import { WeekCalendar } from "@/components/schedule/weekView";
import { Screen } from "@/components/ui";
import { useScheduleViewModeStore } from "@/stores/scheduleViewModeStore";
import { useThemeTokens } from "@/theme";

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
      {viewMode === "week" ? (
        <WeekCalendar weekStartsOn={1} />
      ) : (
        <MonthCalendar weekStartsOn={1} />
      )}
    </Screen>
  );
}
