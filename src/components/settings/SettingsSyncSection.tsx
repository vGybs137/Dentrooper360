import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "react-native";

import { Button, DeleteConfirmationDialog, ThemedText } from "@/components/ui";
import {
  clockIcon,
  deleteIcon,
  pendingChangesIcon,
  syncIcon,
  wifiIcon,
} from "@/constants";
import { synchronize } from "@/database/synchronize";
import { clearApplicationData } from "@/helpers/sync/clearApplicationData";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const native = useNativeColors();
  const customerId = useCustomerId();
  const { isOffline, hasUnsynced, lastSuccessfulSyncAt, refresh } =
    useSyncStatus();
  const syncWifiOnly = useSyncWifiOnly();
  const setSyncWifiOnly = useSyncStatusStore((state) => state.setSyncWifiOnly);
  const onCellular = useIsOnCellular();
  const [clearDataVisible, setClearDataVisible] = useState(false);

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

  const clearDataMutation = useMutation({
    mutationFn: clearApplicationData,
    onSuccess: () => {
      setClearDataVisible(false);
      queryClient.clear();
      router.replace("/(auth)/onboarding" as Href);
    },
  });

  const syncError =
    syncMutation.error instanceof ApiError
      ? syncMutation.error.message
      : syncMutation.isError
        ? t("sync:error.unableSync")
        : undefined;

  const clearDataError =
    clearDataMutation.error instanceof ApiError
      ? clearDataMutation.error.message
      : clearDataMutation.isError
        ? clearDataMutation.error instanceof Error
          ? clearDataMutation.error.message
          : t("sync:error.unableClear")
        : undefined;

  const blockedByWifiOnly = syncWifiOnly && onCellular && !isOffline;
  const canSyncNow =
    Boolean(customerId) &&
    !syncMutation.isPending &&
    !isOffline &&
    !blockedByWifiOnly;
  const canClearData = !clearDataMutation.isPending;

  function requestSyncNow() {
    if (!canSyncNow) {
      return;
    }
    syncMutation.reset();
    syncMutation.mutate();
  }

  function requestClearData() {
    if (!canClearData) {
      return;
    }
    clearDataMutation.reset();
    setClearDataVisible(true);
  }

  function handleCancelClearData() {
    if (clearDataMutation.isPending) {
      return;
    }
    setClearDataVisible(false);
  }

  function handleConfirmClearData() {
    if (clearDataMutation.isPending) {
      return;
    }
    clearDataMutation.mutate();
  }

  return (
    <>
      <SettingsSection label={t("settings:sync.section")}>
        <SettingsRow
          title={t("settings:sync.connection")}
          description={
            isOffline
              ? t("settings:sync.connectionOfflineDesc")
              : t("settings:sync.connectionOnlineDesc")
          }
          icon={wifiIcon}
          trailing={
            <ThemedText tone={isOffline ? "alert" : "success"} variant="label">
              {isOffline ? t("sync:status.offline") : t("sync:status.online")}
            </ThemedText>
          }
        />
        <SettingsRow
          title={t("settings:sync.localChanges")}
          description={
            hasUnsynced
              ? t("settings:sync.localChangesPendingDesc")
              : t("settings:sync.localChangesUpToDateDesc")
          }
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
          title={t("settings:sync.lastSynced")}
          description={t("settings:sync.lastSyncedDesc")}
          icon={clockIcon}
          trailing={
            <ThemedText tone="muted" variant="label">
              {formatLastSyncedAt(lastSuccessfulSyncAt)}
            </ThemedText>
          }
        />
        <SettingsRow
          title={t("settings:sync.wifiOnly")}
          description={
            syncWifiOnly
              ? t("settings:sync.wifiOnlyOnDesc")
              : t("settings:sync.wifiOnlyOffDesc")
          }
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
          title={t("settings:sync.syncData")}
          description={
            isOffline
              ? t("settings:sync.unavailableOffline")
              : blockedByWifiOnly
                ? t("settings:sync.connectWifi")
                : t("settings:sync.forceSyncDesc")
          }
          icon={syncIcon}
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
        {/* Temporary: remove once no longer needed for local wipe / support. */}
        <SettingsRow
          title={t("settings:sync.clearData")}
          description={t("settings:sync.clearDataDesc")}
          icon={deleteIcon}
          last
          trailing={
            <Button
              disabled={!canClearData}
              hitSlop={8}
              label={
                clearDataMutation.isPending
                  ? t("settings:sync.clearing")
                  : t("settings:sync.clearButton")
              }
              onPress={requestClearData}
              size="sm"
              textClassName="font-semibold"
              tone="alert"
              variant="ghost"
            />
          }
        />
        {clearDataError ? (
          <ThemedText
            className="px-inline-comfortable pb-stack-compact"
            tone="alert"
            variant="label"
          >
            {clearDataError}
          </ThemedText>
        ) : null}
      </SettingsSection>

      <DeleteConfirmationDialog
        confirming={clearDataMutation.isPending}
        confirmingLabel={t("settings:sync.clearing")}
        confirmLabel={t("settings:sync.clearConfirm")}
        message={t("settings:sync.clearMessage")}
        onCancel={handleCancelClearData}
        onConfirm={handleConfirmClearData}
        title={t("settings:sync.clearData")}
        visible={clearDataVisible}
      />
    </>
  );
}
