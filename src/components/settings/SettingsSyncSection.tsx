import { useMutation } from "@tanstack/react-query";
import { Switch } from "react-native";

import { Button, ThemedText } from "@/components/ui";
import { clockIcon, pendingChangesIcon, syncIcon, wifiIcon } from "@/constants";
import { synchronize } from "@/database/synchronize";
import { useIsOnCellular } from "@/hooks/useIsOnCellular";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useCustomerId, useSyncStatusStore, useSyncWifiOnly } from "@/stores";
import { useNativeColors } from "@/theme";
import { ApiError } from "@/types/api";

import { formatLastSyncedAt } from "@/helpers/formatLastSyncedAt";
import { SettingsRow, SettingsSection } from "./SettingsSection";

export function SettingsSyncSection() {
  const native = useNativeColors();
  const customerId = useCustomerId();
  const { isOffline, hasUnsynced, lastSuccessfulSyncAt, refresh } =
    useSyncStatus();
  const syncWifiOnly = useSyncWifiOnly();
  const setSyncWifiOnly = useSyncStatusStore((state) => state.setSyncWifiOnly);
  const onCellular = useIsOnCellular();

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!customerId) {
        throw new ApiError("No clinic is paired on this device.", 400);
      }
      if (isOffline) {
        throw new ApiError(
          "You're offline. Sync will run automatically when you're back online.",
          0,
        );
      }
      await synchronize(customerId);
    },
    onSuccess: () => {
      void refresh();
    },
  });

  const syncError =
    syncMutation.error instanceof ApiError
      ? syncMutation.error.message
      : syncMutation.isError
        ? "Unable to sync clinic data. Check your connection and try again."
        : undefined;

  const blockedByWifiOnly = syncWifiOnly && onCellular && !isOffline;
  const canSyncNow =
    Boolean(customerId) &&
    !syncMutation.isPending &&
    !isOffline &&
    !blockedByWifiOnly;
  const showSyncFeedback =
    Boolean(syncError) ||
    (syncMutation.isSuccess && !syncMutation.isPending && !isOffline);

  function requestSyncNow() {
    if (!canSyncNow) {
      return;
    }
    syncMutation.reset();
    syncMutation.mutate();
  }

  return (
    <SettingsSection label="Sync & data">
      <SettingsRow
        title="Connection"
        description={
          isOffline
            ? "No network — changes stay on this device"
            : "Device is connected"
        }
        icon={wifiIcon}
        trailing={
          <ThemedText tone={isOffline ? "alert" : "success"} variant="label">
            {isOffline ? "Offline" : "Online"}
          </ThemedText>
        }
      />
      <SettingsRow
        title="Local changes"
        description={
          hasUnsynced
            ? "Pending changes will sync when you're online"
            : "All data is up to date"
        }
        icon={pendingChangesIcon}
        trailing={
          <ThemedText tone={hasUnsynced ? "brand" : "muted"} variant="label">
            {hasUnsynced ? "Pending" : "Up to date"}
          </ThemedText>
        }
      />
      <SettingsRow
        title="Last synced"
        description="Last successful sync"
        icon={clockIcon}
        trailing={
          <ThemedText tone="muted" variant="label">
            {formatLastSyncedAt(lastSuccessfulSyncAt)}
          </ThemedText>
        }
      />
      <SettingsRow
        title="Sync on Wi-Fi only"
        description={
          syncWifiOnly
            ? "Mobile data sync is blocked"
            : "Allow sync over Wi-Fi and mobile data"
        }
        icon={wifiIcon}
        trailing={
          <Switch
            accessibilityLabel="Sync on Wi-Fi only"
            onValueChange={setSyncWifiOnly}
            trackColor={{
              false: native.border.subtle,
              true: native.brand.default,
            }}
            thumbColor={native.surface.raised}
            value={syncWifiOnly}
          />
        }
      />
      <SettingsRow
        title="Sync data"
        description={
          isOffline
            ? "Unavailable while offline"
            : blockedByWifiOnly
              ? "Connect to Wi-Fi or allow mobile data"
              : "Force sync application data"
        }
        icon={syncIcon}
        last
        trailing={
          <Button
            disabled={!canSyncNow}
            hitSlop={8}
            label={syncMutation.isPending ? "Syncing…" : "Sync"}
            onPress={requestSyncNow}
            size="sm"
            textClassName="font-semibold"
            tone={canSyncNow ? "brand" : "neutral"}
            variant="ghost"
          />
        }
      />
    </SettingsSection>
  );
}
