import { memo } from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { semantic } from "@/tokens";

function ScheduleSyncStatusBannerComponent() {
  const { isOffline, hasUnsynced } = useSyncStatus();

  if (!isOffline && !hasUnsynced) {
    return null;
  }

  const message = isOffline
    ? "You're offline. Changes will sync when you're back online."
    : "Pending changes…";

  return (
    <View
      style={{
        paddingBottom: semantic.space.stack.compact,
      }}
    >
      <ThemedText tone={isOffline ? "alert" : "muted"} variant="label">
        {message}
      </ThemedText>
    </View>
  );
}

export const ScheduleSyncStatusBanner = memo(ScheduleSyncStatusBannerComponent);
