import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Animated from "react-native-reanimated";

import { Button, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { chevronDownIcon, personAddIcon } from "@/constants";
import { isClinicSwitchEnabled } from "@/constants/multiClinicFlags";
import { queryKeys } from "@/constants/queryKeys";
import {
  loadClinicRegistry,
  rememberClinicUserProfile,
  type ClinicRegistryEntry,
} from "@/database/ClinicRegistry";
import { sameCustomerId } from "@/helpers/auth/customerId";
import {
  initialsFromPatientName,
  patientInitialsColorsFromName,
} from "@/helpers/patients/patientInitials";
import { useClinicsList } from "@/hooks/auth/useClinicsList";
import {
  switchClinicErrorMessage,
  useSwitchClinicMutation,
} from "@/hooks/auth/useSwitchClinicMutation";
import { useInlineCollapse } from "@/hooks/ui/useInlineCollapse";
import { persistClinicRefreshToken } from "@/security/vault/clinicRefreshTokenVault";
import {
  useAuthStore,
  useAuthUser,
  useClinicSwitchError,
  useClinicSwitchStore,
  useCustomerId,
  useIsSwitchingClinic,
} from "@/stores";
import { useResolvedTheme } from "@/theme";
import { semantic } from "@/tokens";
import type { ClinicMembership } from "@/types/auth";

const PROFILE_OPTION_HEIGHT = 72;

type ListedClinic = ClinicMembership & {
  /** True when GET /clinics includes this membership (switchClinic works). */
  canMembershipSwitch: boolean;
  profileName: string | null;
};

function clinicFallbackLabel(
  clinic: Pick<ClinicMembership, "customerId" | "clinicDisplayName">,
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

function listedClinicLabel(
  clinic: ListedClinic,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  return clinic.profileName?.trim() || clinicFallbackLabel(clinic, t);
}

function registryMembership(
  customerId: string,
  entry?: ClinicRegistryEntry,
): ListedClinic {
  return {
    customerId,
    providerId: "",
    clinicDisplayName: null,
    syncScope: "",
    scopeVersion: 0,
    roleName: null,
    isActive: true,
    canMembershipSwitch: false,
    profileName: entry?.lastUserFullName ?? null,
  };
}

export function SettingsProfileCard() {
  const { t } = useTranslation(["settings", "common"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const resolvedTheme = useResolvedTheme();
  const clinicSwitchEnabled = isClinicSwitchEnabled();
  const activeCustomerId = useCustomerId();
  const clinicsQuery = useClinicsList();
  const registryQuery = useQuery({
    queryKey: queryKeys.auth.clinicRegistry,
    queryFn: loadClinicRegistry,
    enabled: clinicSwitchEnabled,
  });
  const switchMutation = useSwitchClinicMutation();
  const isSwitching = useIsSwitchingClinic();
  const switchStoreError = useClinicSwitchError();
  const clearSwitchError = useClinicSwitchStore((state) => state.clearError);
  const [expanded, setExpanded] = useState(false);

  const displayName = user?.fullName?.trim() || t("settings:profile.signedIn");
  const activeClinicLabel = useMemo(() => {
    if (!activeCustomerId) {
      return null;
    }
    const membership = (clinicsQuery.data?.clinics ?? []).find((clinic) =>
      sameCustomerId(clinic.customerId, activeCustomerId),
    );
    return clinicFallbackLabel(
      {
        customerId: activeCustomerId,
        clinicDisplayName: membership?.clinicDisplayName ?? null,
      },
      t,
    );
  }, [activeCustomerId, clinicsQuery.data?.clinics, t]);
  const initials = useMemo(
    () => initialsFromPatientName(displayName),
    [displayName],
  );
  const initialsColors = useMemo(
    () =>
      patientInitialsColorsFromName(displayName, {
        isDark: resolvedTheme === "dark",
      }),
    [displayName, resolvedTheme],
  );

  useEffect(() => {
    if (!activeCustomerId || !user) {
      return;
    }
    const refreshToken = useAuthStore.getState().refreshToken;
    void (async () => {
      if (refreshToken) {
        await persistClinicRefreshToken(activeCustomerId, refreshToken);
      }
      await rememberClinicUserProfile(activeCustomerId, {
        fullName: user.fullName,
        email: user.email,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.auth.clinicRegistry,
      });
    })();
  }, [activeCustomerId, queryClient, user]);

  const otherClinics = useMemo(() => {
    const apiClinics = clinicsQuery.data?.clinics ?? [];
    const registry = registryQuery.data?.clinics ?? {};
    const byId = new Map<string, ListedClinic>();

    for (const clinic of apiClinics) {
      const entry = registry[clinic.customerId];
      byId.set(clinic.customerId, {
        ...clinic,
        canMembershipSwitch: true,
        profileName: entry?.lastUserFullName ?? null,
      });
    }

    for (const [customerId, entry] of Object.entries(registry)) {
      if (
        [...byId.values()].some((clinic) =>
          sameCustomerId(clinic.customerId, customerId),
        )
      ) {
        continue;
      }
      byId.set(customerId, registryMembership(customerId, entry));
    }

    return [...byId.values()]
      .filter((clinic) => !sameCustomerId(clinic.customerId, activeCustomerId))
      .sort((a, b) =>
        listedClinicLabel(a, t).localeCompare(listedClinicLabel(b, t)),
      );
  }, [
    activeCustomerId,
    clinicsQuery.data?.clinics,
    registryQuery.data?.clinics,
    t,
  ]);

  const optionGap = semantic.space.gap.compact;
  const rowCount = otherClinics.length + 1; // clinics + "Add account"
  const separatorHeight = 1;
  const contentHeight =
    separatorHeight +
    semantic.space.stack.compact +
    rowCount * PROFILE_OPTION_HEIGHT +
    Math.max(rowCount - 1, 0) * optionGap +
    semantic.space.stack.compact;
  const { containerStyle, chevronStyle, mounted } = useInlineCollapse(
    expanded && clinicSwitchEnabled,
    contentHeight,
  );

  const busy = isSwitching || switchMutation.isPending;
  const switchError =
    switchStoreError ??
    (switchMutation.isError
      ? switchClinicErrorMessage(switchMutation.error)
      : undefined);

  function requestClinic(clinic: ListedClinic) {
    if (busy || !clinic.isActive) {
      return;
    }

    switchMutation.reset();
    clearSwitchError();
    setExpanded(false);
    switchMutation.mutate(clinic.customerId);
  }

  function handleAddAccount() {
    setExpanded(false);
    void queryClient.invalidateQueries({
      queryKey: queryKeys.auth.clinicRegistry,
    });
    router.push({
      pathname: "/(auth)/qr-scanner",
      params: { mode: "add" },
    } as Href);
  }

  const profileRow = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: semantic.space.gap.default,
        paddingHorizontal: semantic.space.inline.comfortable,
        paddingVertical: semantic.space.stack.default,
      }}
    >
      <View
        className="items-center justify-center rounded-pill"
        style={{
          width: semantic.size.touch,
          height: semantic.size.touch,
          backgroundColor: initialsColors.background,
        }}
      >
        <Text
          className="text-body font-semibold"
          style={{ color: initialsColors.foreground }}
        >
          {initials}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: semantic.space.gap.compact }}>
        <ThemedText className="font-semibold" numberOfLines={1} variant="body">
          {displayName}
        </ThemedText>
        {activeClinicLabel ? (
          <ThemedText numberOfLines={1} tone="muted" variant="label">
            {activeClinicLabel}
          </ThemedText>
        ) : null}
      </View>

      {clinicSwitchEnabled ? (
        <Animated.View style={chevronStyle}>
          <ThemedIcon dimension={16} name={chevronDownIcon} tone="muted" />
        </Animated.View>
      ) : null}
    </View>
  );

  return (
    <>
      <ThemedView
        className="overflow-hidden"
        inset="none"
        surface="sunken"
        variant="card"
      >
        {clinicSwitchEnabled ? (
          <Button
            accessibilityState={{ expanded }}
            className="w-full"
            onPress={() => {
              if (!expanded) {
                void queryClient.invalidateQueries({
                  queryKey: queryKeys.auth.clinicRegistry,
                });
                void clinicsQuery.refetch();
              }
              setExpanded((current) => !current);
            }}
            ripple={false}
            size="none"
            tone="neutral"
            variant="ghost"
          >
            {profileRow}
          </Button>
        ) : (
          profileRow
        )}

        {clinicSwitchEnabled && mounted ? (
          <Animated.View
            pointerEvents={expanded ? "auto" : "none"}
            style={containerStyle}
          >
            <View
              style={{
                paddingBottom: semantic.space.stack.compact,
                gap: optionGap,
              }}
            >
              <View
                className="h-px bg-border-subtle"
                style={{
                  marginHorizontal: semantic.space.inline.comfortable,
                  marginBottom: semantic.space.stack.compact,
                }}
              />
              {otherClinics.map((clinic) => {
                const label = listedClinicLabel(clinic, t);
                const clinicName = clinicFallbackLabel(clinic, t);
                const canPress = clinic.isActive && !busy;
                const optionInitials = initialsFromPatientName(label);
                const optionColors = patientInitialsColorsFromName(label, {
                  isDark: resolvedTheme === "dark",
                });
                return (
                  <Button
                    key={clinic.customerId}
                    accessibilityLabel={label}
                    accessibilityState={{ disabled: !canPress }}
                    className="w-full"
                    disabled={!canPress}
                    onPress={() => requestClinic(clinic)}
                    ripple={canPress}
                    size="none"
                    style={{ minHeight: PROFILE_OPTION_HEIGHT }}
                    tone="neutral"
                    variant="ghost"
                  >
                    <View
                      style={{
                        width: "100%",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: semantic.space.gap.default,
                        paddingHorizontal: semantic.space.inline.comfortable,
                        paddingVertical: semantic.space.stack.compact,
                        opacity: canPress ? 1 : 0.5,
                      }}
                    >
                      <View
                        className="items-center justify-center rounded-pill"
                        style={{
                          width: semantic.size.touch,
                          height: semantic.size.touch,
                          backgroundColor: optionColors.background,
                        }}
                      >
                        <Text
                          className="text-body font-semibold"
                          style={{ color: optionColors.foreground }}
                        >
                          {optionInitials}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          minWidth: 0,
                          gap: semantic.space.gap.compact,
                        }}
                      >
                        <ThemedText
                          className="font-semibold"
                          numberOfLines={1}
                          variant="body"
                        >
                          {label}
                        </ThemedText>
                        <ThemedText
                          numberOfLines={1}
                          tone="muted"
                          variant="label"
                        >
                          {clinicName}
                        </ThemedText>
                      </View>
                    </View>
                  </Button>
                );
              })}
              <Button
                accessibilityLabel={t("settings:profile.addAccount")}
                className="w-full"
                disabled={busy}
                onPress={handleAddAccount}
                ripple={!busy}
                size="none"
                style={{ minHeight: PROFILE_OPTION_HEIGHT }}
                tone="neutral"
                variant="ghost"
              >
                <View
                  style={{
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: semantic.space.gap.default,
                    paddingHorizontal: semantic.space.inline.comfortable,
                    paddingVertical: semantic.space.stack.compact,
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  <View
                    className="items-center justify-center rounded-pill bg-brand-subtle"
                    style={{
                      width: semantic.size.touch,
                      height: semantic.size.touch,
                    }}
                  >
                    <ThemedIcon name={personAddIcon} tone="brand" />
                  </View>
                  <View
                    style={{
                      flex: 1,
                      minWidth: 0,
                      gap: semantic.space.gap.compact,
                    }}
                  >
                    <ThemedText
                      className="font-semibold"
                      numberOfLines={1}
                      tone="brand"
                      variant="body"
                    >
                      {t("settings:profile.addAccount")}
                    </ThemedText>
                    <ThemedText
                      numberOfLines={1}
                      tone="muted"
                      variant="label"
                    >
                      {t("settings:profile.addAccountDescription")}
                    </ThemedText>
                  </View>
                </View>
              </Button>
            </View>
          </Animated.View>
        ) : null}

        {switchError ? (
          <View
            style={{
              paddingHorizontal: semantic.space.inline.comfortable,
              paddingBottom: semantic.space.stack.compact,
            }}
          >
            <ThemedText tone="alert" variant="label">
              {switchError}
            </ThemedText>
          </View>
        ) : null}
      </ThemedView>
    </>
  );
}
