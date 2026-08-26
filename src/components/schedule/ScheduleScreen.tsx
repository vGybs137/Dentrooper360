import type { ReactNode } from "react";

import { ScheduleSyncStatusBanner } from "@/components/schedule/ScheduleSyncStatusBanner";
import { Screen } from "@/components/ui";
import { useThemeTokens } from "@/theme";

type ScheduleScreenProps = {
  children: ReactNode;
};

export function ScheduleScreen({ children }: ScheduleScreenProps) {
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
      <ScheduleSyncStatusBanner />
      {children}
    </Screen>
  );
}
