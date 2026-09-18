import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { logout } from "@/api";
import { Button, DeleteConfirmationDialog, ThemedText } from "@/components/ui";
import { deleteIcon, logoutIcon } from "@/constants";
import { sameCustomerId } from "@/helpers/auth/customerId";
import { useClinicsList } from "@/hooks/auth/useClinicsList";
import {
  removeClinicErrorMessage,
  useRemoveClinicMutation,
} from "@/hooks/auth/useRemoveClinicMutation";
import { useSyncStatus } from "@/hooks/sync/useSyncStatus";
import { RemoveClinicError } from "@/session/removeClinic";
import { useCustomerId } from "@/stores";
import { ApiError } from "@/types/api";

import { SettingsRow, SettingsSection } from "./SettingsSection";

export function SettingsAccountSection() {
  const { t } = useTranslation(["settings", "a11y"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const customerId = useCustomerId();
  const clinicsQuery = useClinicsList();
  const { hasUnsynced } = useSyncStatus();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [removeVisible, setRemoveVisible] = useState(false);

  const clinicLabel = useMemo(() => {
    if (!customerId) {
      return null;
    }
    const membership = (clinicsQuery.data?.clinics ?? []).find((clinic) =>
      sameCustomerId(clinic.customerId, customerId),
    );
    const name = membership?.clinicDisplayName?.trim();
    if (name) {
      return name;
    }
    return t("settings:clinics.fallbackName", {
      idPrefix: customerId.length > 8 ? customerId.slice(0, 8) : customerId,
    });
  }, [clinicsQuery.data?.clinics, customerId, t]);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setLogoutVisible(false);
      queryClient.clear();
      router.replace("/(auth)/login" as Href);
    },
  });

  const removeMutation = useRemoveClinicMutation();

  const logoutError =
    logoutMutation.error instanceof ApiError
      ? logoutMutation.error.message
      : logoutMutation.isError
        ? t("settings:profile.logoutError")
        : undefined;

  const removeError = removeMutation.isError
    ? removeMutation.error instanceof RemoveClinicError &&
      removeMutation.error.code === "UNSYNCED_CHANGES"
      ? t("settings:clinics.error.stillPending")
      : removeClinicErrorMessage(removeMutation.error) ||
        t("settings:clinics.removeErrorGeneric")
    : undefined;

  const canLogout = !logoutMutation.isPending && !removeMutation.isPending;
  const canRemove =
    Boolean(customerId) &&
    !removeMutation.isPending &&
    !logoutMutation.isPending;

  const logoutMessage = hasUnsynced
    ? t("settings:profile.logoutMessageUnsynced")
    : t("settings:profile.logoutMessage");

  const removeMessage = clinicLabel
    ? t("settings:clinics.removeMessage", { clinic: clinicLabel })
    : t("settings:clinics.removeMessageFallback");

  return (
    <>
      <SettingsSection label={t("settings:account.section")}>
        <SettingsRow
          description={t("settings:account.removeClinicDesc")}
          icon={deleteIcon}
          title={t("settings:clinics.removeTitle")}
          trailing={
            <Button
              accessibilityLabel={t("settings:clinics.removeTitle")}
              disabled={!canRemove}
              hitSlop={8}
              label={
                removeMutation.isPending
                  ? t("settings:account.removing")
                  : t("settings:clinics.removeTitle")
              }
              onPress={() => {
                if (!canRemove) {
                  return;
                }
                removeMutation.reset();
                setRemoveVisible(true);
              }}
              size="sm"
              textClassName="font-semibold"
              tone="alert"
              variant="ghost"
            />
          }
        />
        <SettingsRow
          description={t("settings:account.logoutDesc")}
          icon={logoutIcon}
          last
          title={t("settings:profile.logoutTitle")}
          trailing={
            <Button
              accessibilityLabel={t("a11y:logOut")}
              disabled={!canLogout}
              hitSlop={8}
              label={
                logoutMutation.isPending
                  ? t("settings:profile.signingOut")
                  : t("settings:profile.logoutTitle")
              }
              onPress={() => {
                if (!canLogout) {
                  return;
                }
                logoutMutation.reset();
                setLogoutVisible(true);
              }}
              size="sm"
              textClassName="font-semibold"
              tone="alert"
              variant="ghost"
            />
          }
        />
        {removeError ? (
          <ThemedText
            className="px-inline-comfortable pb-stack-compact"
            tone="alert"
            variant="label"
          >
            {removeError}
          </ThemedText>
        ) : null}
        {logoutError ? (
          <ThemedText
            className="px-inline-comfortable pb-stack-compact"
            tone="alert"
            variant="label"
          >
            {logoutError}
          </ThemedText>
        ) : null}
      </SettingsSection>

      <DeleteConfirmationDialog
        confirming={removeMutation.isPending}
        confirmingLabel={t("settings:account.removing")}
        confirmLabel={t("settings:clinics.removeConfirm")}
        message={removeMessage}
        onCancel={() => {
          if (removeMutation.isPending) {
            return;
          }
          setRemoveVisible(false);
        }}
        onConfirm={() => {
          if (!customerId) {
            return;
          }
          removeMutation.mutate(customerId, {
            onSuccess: () => {
              setRemoveVisible(false);
            },
          });
        }}
        title={t("settings:clinics.removeTitle")}
        visible={removeVisible}
      />

      <DeleteConfirmationDialog
        confirming={logoutMutation.isPending}
        confirmingLabel={t("settings:profile.signingOut")}
        confirmLabel={t("settings:profile.logoutConfirm")}
        message={logoutMessage}
        onCancel={() => {
          if (logoutMutation.isPending) {
            return;
          }
          setLogoutVisible(false);
        }}
        onConfirm={() => {
          logoutMutation.mutate();
        }}
        title={t("settings:profile.logoutTitle")}
        visible={logoutVisible}
      />
    </>
  );
}
