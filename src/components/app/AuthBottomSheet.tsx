import { type ReactNode } from "react";
import { type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedView } from "@/components/ui";
import { semantic } from "@/tokens";
import { cn } from "@/helpers/ui/cn";

type AuthBottomSheetProps = {
  children: ReactNode;
  pointerEvents?: ViewProps["pointerEvents"];
  className?: string;
};

export function AuthBottomSheet({
  children,
  pointerEvents,
  className,
}: AuthBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView
      className={cn("rounded-t-dialog px-inline-comfortable pt-section", className)}
      pointerEvents={pointerEvents}
      surface="raised"
      style={{ paddingBottom: semantic.space.section + insets.bottom }}
    >
      {children}
    </ThemedView>
  );
}
