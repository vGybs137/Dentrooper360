import { MonthCalendar } from "@/components/schedule/monthView";
import { Screen } from "@/components/ui";
import { useThemeTokens } from "@/theme";

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
      <MonthCalendar weekStartsOn={1} />
    </Screen>
  );
}
