import { type Href, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  Button,
  DeleteConfirmationDialog,
  ThemedIcon,
  ThemedText,
} from "@/components/ui";
import { checkCircleIcon, locationIcon } from "@/constants";
import { isClinicSwitchEnabled } from "@/constants/multiClinicFlags";
import { cn } from "@/helpers/ui/cn";
import { useClinicsList } from "@/hooks/auth/useClinicsList";
import {
  removeClinicErrorMessage,
  useRemoveClinicMutation,
} from "@/hooks/auth/useRemoveClinicMutation";
import {
  switchClinicErrorMessage,
  useSwitchClinicMutation,
} from "@/hooks/auth/useSwitchClinicMutation";
import {
  useClinicSwitchError,
  useClinicSwitchStore,
  useCustomerId,
  useIsSwitchingClinic,
} from "@/stores";
import { semantic } from "@/tokens";
import type { ClinicMembership } from "@/types/auth";

import { SettingsRowLabel, SettingsSection } from "./SettingsSection";

function clinicLabel(
  clinic: ClinicMembership,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const name = clinic.clinicDisplayName?.trim();
  if (name) {
    return name;
  }
  const id = clinic.customerId;
  return t("settings:clinics.fallbackName", {
    idPrefix: id.length > 8 ? id.slice(0, 8) : id,
  });
}

export function SettingsClinicsSection() {
  const { t } = useTranslation(["settings", "common"]);
  const router = useRouter();
  const activeCustomerId = useCustomerId();
  const clinicsQuery = useClinicsList();
  const switchMutation = useSwitchClinicMutation();
  const removeMutation = useRemoveClinicMutation();
  const isSwitching = useIsSwitchingClinic();
  const switchStoreError = useClinicSwitchError();
  const clearSwitchError = useClinicSwitchStore((state) => state.clearError);
  const [pendingClinic, setPendingClinic] = useState<ClinicMembership | null>(
    null,
  );
  const [pendingRemove, setPendingRemove] = useState<ClinicMembership | null>(
    null,
  );

  const clinics = clinicsQuery.data?.clinics ?? [];
  const sortedClinics = useMemo(() => {
    return [...clinics].sort((a, b) => {
      const aActive = a.customerId === activeCustomerId ? 0 : 1;
      const bActive = b.customerId === activeCustomerId ? 0 : 1;
      if (aActive !== bActive) {
        return aActive - bActive;
      }
      return clinicLabel(a, t).localeCompare(clinicLabel(b, t));
    });
  }, [activeCustomerId, clinics, t]);

  if (!isClinicSwitchEnabled()) {
    return null;
  }

  const busy = isSwitching || removeMutation.isPending;
  const switchError =
    switchStoreError ??
    (switchMutation.isError
      ? switchClinicErrorMessage(switchMutation.error)
      : undefined);
  const removeError = removeMutation.isError
    ? removeClinicErrorMessage(removeMutation.error)
    : undefined;
  const listError =
    clinicsQuery.isError && !clinicsQuery.data
      ? switchClinicErrorMessage(clinicsQuery.error)
      : undefined;

  function requestSwitch(clinic: ClinicMembership) {
    if (busy) {
      return;
    }
    if (!clinic.isActive || clinic.customerId === activeCustomerId) {
      return;
    }
    switchMutation.reset();
    clearSwitchError();
    setPendingClinic(clinic);
  }

  function handleCancelSwitch() {
    if (busy) {
      return;
    }
    setPendingClinic(null);
  }

  function handleConfirmSwitch() {
    if (!pendingClinic || busy) {
      return;
    }
    const targetCustomerId = pendingClinic.customerId;
    setPendingClinic(null);
    switchMutation.mutate(targetCustomerId);
  }

  function handleConfirmRemove() {
    if (!pendingRemove || busy) {
      return;
    }
    const targetCustomerId = pendingRemove.customerId;
    setPendingRemove(null);
    removeMutation.mutate(targetCustomerId);
  }

  return (
    <>
      <SettingsSection label={t("settings:clinics.section")}>
        {clinicsQuery.isLoading && sortedClinics.length === 0 ? (
          <View
            style={{
              paddingHorizontal: semantic.space.inline.comfortable,
              paddingVertical: semantic.space.stack.default,
              minHeight: semantic.size.touch,
              justifyContent: "center",
            }}
          >
            <ThemedText tone="muted" variant="label">
              {t("settings:clinics.loading")}
            </ThemedText>
          </View>
        ) : null}

        {listError ? (
          <View
            style={{
              paddingHorizontal: semantic.space.inline.comfortable,
              paddingVertical: semantic.space.stack.default,
              gap: semantic.space.gap.compact,
            }}
          >
            <ThemedText tone="alert" variant="label">
              {listError}
            </ThemedText>
            <Button
              disabled={clinicsQuery.isFetching}
              hitSlop={8}
              label={
                clinicsQuery.isFetching
                  ? t("common:actions.retrying")
                  : t("common:actions.retry")
              }
              onPress={() => {
                void clinicsQuery.refetch();
              }}
              size="sm"
              textClassName="font-semibold"
              tone="brand"
              variant="ghost"
            />
          </View>
        ) : null}

        {!listError && !clinicsQuery.isLoading && sortedClinics.length === 0 ? (
          <View
            style={{
              paddingHorizontal: semantic.space.inline.comfortable,
              paddingVertical: semantic.space.stack.default,
            }}
          >
            <ThemedText tone="muted" variant="label">
              {t("settings:clinics.empty")}
            </ThemedText>
          </View>
        ) : null}

        {sortedClinics.map((clinic, index) => {
          const isCurrent = clinic.customerId === activeCustomerId;
          const canSwitch = clinic.isActive && !isCurrent && !busy;
          const description = isCurrent
            ? t("settings:clinics.currentDescription")
            : clinic.isActive
              ? t("settings:clinics.switchDescription")
              : t("settings:clinics.inactiveDescription");
          const isLast =
            index === sortedClinics.length - 1 &&
            !switchError &&
            !removeError;
          const label = clinicLabel(clinic, t);

          return (
            <View
              key={clinic.customerId}
              className={cn(!isLast && "border-b border-border-subtle")}
            >
              <Button
                accessibilityLabel={label}
                accessibilityState={{
                  selected: isCurrent,
                  disabled: !canSwitch,
                }}
                className="w-full"
                disabled={!canSwitch}
                onPress={() => requestSwitch(clinic)}
                ripple={canSwitch}
                size="none"
                tone="neutral"
                variant="ghost"
              >
                <View
                  style={{
                    width: "100%",
                    minHeight: semantic.size.touch,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: semantic.space.gap.default,
                    paddingHorizontal: semantic.space.inline.comfortable,
                    paddingVertical: semantic.space.stack.default,
                  }}
                >
                  <SettingsRowLabel
                    description={description}
                    icon={locationIcon}
                    title={label}
                  />
                  {isCurrent ? (
                    <View style={{ flexShrink: 0, justifyContent: "center" }}>
                      <ThemedIcon name={checkCircleIcon} tone="brand" />
                    </View>
                  ) : null}
                </View>
              </Button>
              <View
                style={{
                  paddingHorizontal: semantic.space.inline.comfortable,
                  paddingBottom: semantic.space.stack.compact,
                }}
              >
                <Button
                  disabled={busy}
                  hitSlop={8}
                  label={t("settings:clinics.removeTitle")}
                  onPress={() => {
                    removeMutation.reset();
                    setPendingRemove(clinic);
                  }}
                  size="sm"
                  textClassName="font-semibold"
                  tone="alert"
                  variant="ghost"
                />
              </View>
            </View>
          );
        })}

        <View
          style={{
            paddingHorizontal: semantic.space.inline.comfortable,
            paddingVertical: semantic.space.stack.default,
            borderTopWidth: sortedClinics.length > 0 ? 1 : 0,
            borderTopColor: "transparent",
          }}
          className={cn(sortedClinics.length > 0 && "border-t border-border-subtle")}
        >
          <Button
            disabled={busy}
            label={t("settings:clinics.addClinic")}
            onPress={() => {
              router.push({
                pathname: "/(auth)/qr-scanner",
                params: { mode: "add" },
              } as Href);
            }}
            size="sm"
            textClassName="font-semibold"
            tone="brand"
            variant="ghost"
          />
          <ThemedText className="mt-1" tone="muted" variant="label">
            {t("settings:clinics.addClinicDescription")}
          </ThemedText>
        </View>

        {switchError || removeError ? (
          <ThemedText
            className="px-inline-comfortable pb-stack-compact"
            tone="alert"
            variant="label"
          >
            {removeError ?? switchError}
          </ThemedText>
        ) : null}
      </SettingsSection>

      <DeleteConfirmationDialog
        confirming={false}
        confirmLabel={t("settings:clinics.switchConfirm")}
        message={
          pendingClinic
            ? t("settings:clinics.switchMessage", {
                clinic: clinicLabel(pendingClinic, t),
              })
            : t("settings:clinics.switchMessageFallback")
        }
        onCancel={handleCancelSwitch}
        onConfirm={handleConfirmSwitch}
        title={t("settings:clinics.switchTitle")}
        visible={pendingClinic != null}
      />

      <DeleteConfirmationDialog
        confirming={removeMutation.isPending}
        confirmLabel={t("settings:clinics.removeConfirm")}
        message={
          pendingRemove
            ? t("settings:clinics.removeMessage", {
                clinic: clinicLabel(pendingRemove, t),
              })
            : t("settings:clinics.removeMessageFallback")
        }
        onCancel={() => {
          if (!removeMutation.isPending) {
            setPendingRemove(null);
          }
        }}
        onConfirm={handleConfirmRemove}
        title={t("settings:clinics.removeTitle")}
        visible={pendingRemove != null}
      />
    </>
  );
}
