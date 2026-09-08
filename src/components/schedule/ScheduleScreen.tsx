import type { ReactNode } from "react";

import { ThemedView } from "@/components/ui";
import { BOTTOM_TAB_INSET } from "@/constants/navigation";
import { monthViewScreenBottomPadding } from "@/helpers/schedule/monthViewLayout";
import { useStableSafeAreaInsets } from "@/helpers/ui/safeAreaInsets";

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
      {children}
    </ThemedView>
  );
}
