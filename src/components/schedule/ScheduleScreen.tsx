import type { ReactNode } from "react";

import { ScheduleSyncStatusBanner } from "@/components/schedule/ScheduleSyncStatusBanner";
import { ThemedView } from "@/components/ui";
import { semantic } from "@/tokens";

type ScheduleScreenProps = {
  children: ReactNode;
};

export function ScheduleScreen({ children }: ScheduleScreenProps) {
  return (
    <ThemedView
      bottomInset={semantic.space.stack.compact}
      edges={["top", "left", "right"]}
      inset="compact"
      padBottom={false}
      scroll={false}
      surface="default"
      variant="screen"
    >
      <ScheduleSyncStatusBanner />
      {children}
    </ThemedView>
  );
}
