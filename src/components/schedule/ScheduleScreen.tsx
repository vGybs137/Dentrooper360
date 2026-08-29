import type { ReactNode } from "react";

import { ScheduleSyncStatusBanner } from "@/components/schedule/ScheduleSyncStatusBanner";
import { ThemedView } from "@/components/ui";
import { BOTTOM_TAB_INSET } from "@/constants/navigation";
import { monthViewScreenBottomPadding } from "@/helpers/monthViewLayout";
import { useStableSafeAreaInsets } from "@/helpers/safeAreaInsets";

type ScheduleScreenProps = {
  children: ReactNode;
};

export function ScheduleScreen({ children }: ScheduleScreenProps) {
  const insets = useStableSafeAreaInsets();
  const bottomInset = monthViewScreenBottomPadding(insets, BOTTOM_TAB_INSET);

  return (
    <ThemedView
      bottomInset={bottomInset}
      edges={["left", "right"]}
      inset="compact"
      padBottom={false}
      scroll={false}
      surface="default"
      variant="screen"
      style={{ paddingTop: insets.top }}
    >
      <ScheduleSyncStatusBanner />
      {children}
    </ThemedView>
  );
}
