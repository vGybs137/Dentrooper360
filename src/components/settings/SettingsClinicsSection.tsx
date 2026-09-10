import { useMemo, useState } from "react";
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

function clinicLabel(clinic: ClinicMembership): string {
  const name = clinic.clinicDisplayName?.trim();
  if (name) {
    return name;
  }
  const id = clinic.customerId;
  return id.length > 8 ? `Clinic ${id.slice(0, 8)}…` : `Clinic ${id}`;
}

export function SettingsClinicsSection() {
  const activeCustomerId = useCustomerId();
  const clinicsQuery = useClinicsList();
  const switchMutation = useSwitchClinicMutation();
  const isSwitching = useIsSwitchingClinic();
  const switchStoreError = useClinicSwitchError();
  const clearSwitchError = useClinicSwitchStore((state) => state.clearError);
  const [pendingClinic, setPendingClinic] = useState<ClinicMembership | null>(
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
      return clinicLabel(a).localeCompare(clinicLabel(b));
    });
  }, [activeCustomerId, clinics]);

  if (!isClinicSwitchEnabled()) {
    return null;
  }

  const switchError =
    switchStoreError ??
    (switchMutation.isError
      ? switchClinicErrorMessage(switchMutation.error)
      : undefined);
  const listError =
    clinicsQuery.isError && !clinicsQuery.data
      ? switchClinicErrorMessage(clinicsQuery.error)
      : undefined;

  function requestSwitch(clinic: ClinicMembership) {
    if (isSwitching) {
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
    if (isSwitching) {
      return;
    }
    setPendingClinic(null);
  }

  function handleConfirmSwitch() {
    if (!pendingClinic || isSwitching) {
      return;
    }
    const targetCustomerId = pendingClinic.customerId;
    setPendingClinic(null);
    switchMutation.mutate(targetCustomerId);
  }

  return (
    <>
      <SettingsSection label="Clinics">
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
              Loading clinics…
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
              label={clinicsQuery.isFetching ? "Retrying…" : "Retry"}
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
              No clinic memberships found for this account.
            </ThemedText>
          </View>
        ) : null}

        {sortedClinics.map((clinic, index) => {
          const isCurrent = clinic.customerId === activeCustomerId;
          const canSwitch = clinic.isActive && !isCurrent && !isSwitching;
          const description = isCurrent
            ? "Signed in on this device"
            : clinic.isActive
              ? "Tap to switch and sync this clinic"
              : "Membership inactive — switching unavailable";
          const isLast = index === sortedClinics.length - 1 && !switchError;

          return (
            <View
              key={clinic.customerId}
              className={cn(!isLast && "border-b border-border-subtle")}
            >
              <Button
                accessibilityLabel={clinicLabel(clinic)}
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
                    title={clinicLabel(clinic)}
                  />
                  {isCurrent ? (
                    <View style={{ flexShrink: 0, justifyContent: "center" }}>
                      <ThemedIcon name={checkCircleIcon} tone="brand" />
                    </View>
                  ) : null}
                </View>
              </Button>
            </View>
          );
        })}

        {switchError ? (
          <ThemedText
            className="px-inline-comfortable pb-stack-compact"
            tone="alert"
            variant="label"
          >
            {switchError}
          </ThemedText>
        ) : null}
      </SettingsSection>

      <DeleteConfirmationDialog
        confirming={false}
        confirmLabel="Yes, switch clinic"
        message={
          pendingClinic
            ? `Switch to ${clinicLabel(pendingClinic)}? Local changes sync first. Downloading clinic data may take a moment.`
            : "Switch clinics?"
        }
        onCancel={handleCancelSwitch}
        onConfirm={handleConfirmSwitch}
        title="Switch clinic"
        visible={pendingClinic != null}
      />
    </>
  );
}
