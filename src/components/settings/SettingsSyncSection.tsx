import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Switch } from "react-native";

import { Button, ThemedText } from "@/components/ui";
import {
  clockIcon,
  pendingChangesIcon,
  syncIcon,
  wifiIcon,
} from "@/constants";
import { synchronize } from "@/database/synchronize";
import { formatLastSyncedAt } from "@/helpers/sync/formatLastSyncedAt";
import { useIsOnCellular } from "@/hooks/sync/useIsOnCellular";
import { useSyncStatus } from "@/hooks/sync/useSyncStatus";
import { t as translate } from "@/i18n";
import { useCustomerId, useSyncStatusStore, useSyncWifiOnly } from "@/stores";
import { useNativeColors } from "@/theme";
import { ApiError } from "@/types/api";

import { SettingsRow, SettingsSection } from "./SettingsSection";

export function SettingsSyncSection() {
  const { t } = useTranslation(["settings", "sync", "a11y"]);
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
        throw new ApiError(translate("sync:error.noClinicPaired"), 400);
      }
      if (isOffline) {
        throw new ApiError(translate("sync:error.offlineAuto"), 0);
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
        ? t("sync:error.unableSync")
        : undefined;

  const blockedByWifiOnly = syncWifiOnly && onCellular && !isOffline;
  const canSyncNow =
    Boolean(customerId) &&
    !syncMutation.isPending &&
    !isOffline &&
    !blockedByWifiOnly;

  function requestSyncNow() {
    if (!canSyncNow) {
      return;
    }
    syncMutation.reset();
    syncMutation.mutate();
  }

  return (
    <SettingsSection label={t("settings:sync.section")}>
      <SettingsRow
        description={
          isOffline
            ? t("settings:sync.connectionOfflineDesc")
            : t("settings:sync.connectionOnlineDesc")
        }
        title={t("settings:sync.connection")}
        icon={wifiIcon}
        trailing={
          <ThemedText tone={isOffline ? "alert" : "success"} variant="label">
            {isOffline ? t("sync:status.offline") : t("sync:status.online")}
          </ThemedText>
        }
      />
      <SettingsRow
        description={
          hasUnsynced
            ? t("settings:sync.localChangesPendingDesc")
            : t("settings:sync.localChangesUpToDateDesc")
        }
        title={t("settings:sync.localChanges")}
        icon={pendingChangesIcon}
        trailing={
          <ThemedText tone={hasUnsynced ? "brand" : "muted"} variant="label">
            {hasUnsynced
              ? t("settings:sync.pending")
              : t("settings:sync.upToDate")}
          </ThemedText>
        }
      />
      <SettingsRow
        description={t("settings:sync.lastSyncedDesc")}
        title={t("settings:sync.lastSynced")}
        icon={clockIcon}
        trailing={
          <ThemedText tone="muted" variant="label">
            {formatLastSyncedAt(lastSuccessfulSyncAt)}
          </ThemedText>
        }
      />
      <SettingsRow
        description={
          syncWifiOnly
            ? t("settings:sync.wifiOnlyOnDesc")
            : t("settings:sync.wifiOnlyOffDesc")
        }
        title={t("settings:sync.wifiOnly")}
        icon={wifiIcon}
        trailing={
          <Switch
            accessibilityLabel={t("a11y:syncWifiOnly")}
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
        description={
          isOffline
            ? t("settings:sync.unavailableOffline")
            : blockedByWifiOnly
              ? t("settings:sync.connectWifi")
              : t("settings:sync.forceSyncDesc")
        }
        title={t("settings:sync.syncData")}
        icon={syncIcon}
        last
        trailing={
          <Button
            disabled={!canSyncNow}
            hitSlop={8}
            label={
              syncMutation.isPending
                ? t("settings:sync.syncing")
                : t("settings:sync.syncButton")
            }
            onPress={requestSyncNow}
            size="sm"
            textClassName="font-semibold"
            tone={canSyncNow ? "brand" : "neutral"}
            variant="ghost"
          />
        }
      />
      {syncError ? (
        <ThemedText
          className="px-inline-comfortable pb-stack-compact"
          tone="alert"
          variant="label"
        >
          {syncError}
        </ThemedText>
      ) : null}
    </SettingsSection>
  );
}
