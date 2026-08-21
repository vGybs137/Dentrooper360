import { useSegments } from "expo-router";
import { Platform } from "react-native";

import { MonthCalendar } from "@/components/schedule/monthView";
import { Screen } from "@/components/ui";
import { BOTTOM_TAB_INSET } from "@/constants/navigation";

/** Full-screen month calendar preview. */
export default function ScheduleScreen() {
  const segments = useSegments();
  const bottomInset =
    segments[0] === "(tabs)"
      ? Platform.OS === "web"
        ? BOTTOM_TAB_INSET
        : 8
      : 0;

  return (
    <Screen bottomInset={bottomInset} inset="compact" scroll={false}>
      <MonthCalendar />
    </Screen>
  );
}
