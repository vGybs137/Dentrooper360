import { MonthCalendar } from "@/components/schedule/monthView";
import { WeekCalendar } from "@/components/schedule/weekView";
import { Screen } from "@/components/ui";
import { useThemeTokens } from "@/theme";

/** Step 3 review: week stub. Step 10 adds Month | Week toggle. */
const USE_WEEK_VIEW_STUB = true;

/** Full-screen month calendar; flush to the native tab bar. */
export default function ScheduleScreen() {
  const theme = useThemeTokens();

  return (
    <Screen
      edges={["top", "left", "right"]}
      inset="compact"
      padBottom={false}
      bottomInset={theme.semantic.space.stack.compact}
      scroll={false}
      style={{ backgroundColor: theme.palette.surface.default }}
    >
      {USE_WEEK_VIEW_STUB ? (
        <WeekCalendar weekStartsOn={1} />
      ) : (
        <MonthCalendar weekStartsOn={1} />
      )}
    </Screen>
  );
}
