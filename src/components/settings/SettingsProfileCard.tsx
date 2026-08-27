import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { logout } from "@/api";
import { Button, DeleteConfirmationDialog, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { chevronDownIcon, logoutIcon } from "@/constants";
import { useAppointmentFormOptions } from "@/hooks/useAppointmentFormOptions";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import {
  resolveDefaultLocationId,
  useAuthUser,
  useSchedulePreferencesStore,
} from "@/stores";
import { semantic } from "@/tokens";
import { ApiError } from "@/types/api";

const OPTION_ROW_HEIGHT = 44;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function SettingsProfileCard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthUser();
  const { hasUnsynced, isOffline } = useSyncStatus();
  const defaultLocationId = useSchedulePreferencesStore(
    (state) => state.defaultLocationId,
  );
  const setDefaultLocationId = useSchedulePreferencesStore(
    (state) => state.setDefaultLocationId,
  );
  const { locations, isLoading: locationsLoading } = useAppointmentFormOptions({
    loadPatients: false,
    enabled: true,
  });
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const displayName = user?.fullName?.trim() || "Signed in";
  const displayEmail = user?.email?.trim() || null;
  const locationOptions = locations.map((location) => ({
    value: location.id,
    label: location.name,
  }));
  const selectedLocationId =
    resolveDefaultLocationId(
      locationOptions.map((option) => option.value),
      defaultLocationId,
    ) ?? "";
  const selectedLocationLabel =
    locationOptions.find((option) => option.value === selectedLocationId)
      ?.label ?? (locationsLoading ? "Loading…" : "No location");

  const optionGap = semantic.space.gap.compact;
  const contentHeight =
    locationOptions.length * OPTION_ROW_HEIGHT +
    Math.max(locationOptions.length - 1, 0) * optionGap +
    semantic.space.stack.compact;
  const { containerStyle, chevronStyle, mounted } = useInlineCollapse(
    locationExpanded && locationOptions.length > 0,
    contentHeight,
  );

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setLogoutVisible(false);
      queryClient.clear();
      router.replace("/(auth)/login" as Href);
    },
  });

  const logoutError =
    logoutMutation.error instanceof ApiError
      ? logoutMutation.error.message
      : logoutMutation.isError
        ? "Unable to sync clinic data. Stay online and try logging out again."
        : undefined;

  const logoutMessage = hasUnsynced
    ? "You have local changes that haven't synced yet. Logging out will try to sync first and may fail if you're offline."
    : "Are you sure you want to log out of this device.";

  useEffect(() => {
    if (locationsLoading || locations.length === 0) {
      return;
    }

    const resolved = resolveDefaultLocationId(
      locations.map((location) => location.id),
      defaultLocationId,
    );
    if (resolved && resolved !== defaultLocationId) {
      setDefaultLocationId(resolved);
    }
  }, [
    defaultLocationId,
    locations,
    locationsLoading,
    setDefaultLocationId,
  ]);

  const canLogout = !isOffline && !logoutMutation.isPending;

  function requestLogout() {
    if (!canLogout) {
      return;
    }
    logoutMutation.reset();
    setLogoutVisible(true);
  }

  function handleCancelLogout() {
    if (logoutMutation.isPending) {
      return;
    }
    setLogoutVisible(false);
  }

  function handleConfirmLogout() {
    if (isOffline) {
      setLogoutVisible(false);
      return;
    }
    logoutMutation.mutate();
  }

  return (
    <>
      <ThemedView className="overflow-hidden" inset="none" variant="card">
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
          className="items-center justify-center rounded-pill bg-brand-subtle"
          style={{
            width: semantic.size.touch,
            height: semantic.size.touch,
          }}
        >
          <ThemedText className="font-semibold" tone="brand" variant="body">
            {initialsFromName(displayName)}
          </ThemedText>
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: semantic.space.gap.compact }}>
          <ThemedText className="font-semibold" numberOfLines={1} variant="body">
            {displayName}
          </ThemedText>
          <ThemedText numberOfLines={1} tone="muted" variant="label">
            {logoutMutation.isPending
              ? "Signing out…"
              : (displayEmail ?? "Clinic pairing stays on this device")}
          </ThemedText>
        </View>

        <Button
          accessibilityLabel="Log out"
          accessibilityState={{ disabled: !canLogout }}
          disabled={!canLogout}
          hitSlop={8}
          onPress={requestLogout}
          size="none"
          style={{
            width: semantic.size.touch,
            height: semantic.size.touch,
            alignItems: "center",
            justifyContent: "center",
          }}
          tone="neutral"
          variant="ghost"
        >
          <ThemedIcon
            name={logoutIcon}
            tone={canLogout ? "alert" : "muted"}
          />
        </Button>
      </View>

      {logoutError ? (
        <View
          style={{
            paddingHorizontal: semantic.space.inline.comfortable,
            paddingBottom: semantic.space.stack.compact,
          }}
        >
          <ThemedText tone="alert" variant="label">
            {logoutError}
          </ThemedText>
        </View>
      ) : null}

      <View
        className="h-px bg-border-subtle"
        style={{ marginHorizontal: semantic.space.inline.comfortable }}
      />

      <Button
        accessibilityLabel={selectedLocationLabel}
        accessibilityState={{
          expanded: locationExpanded,
          disabled: locationOptions.length === 0,
        }}
        className="w-full"
        disabled={locationOptions.length === 0}
        onPress={() => setLocationExpanded((current) => !current)}
        ripple={false}
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
            justifyContent: "center",
            gap: semantic.space.gap.compact,
            paddingHorizontal: semantic.space.inline.comfortable,
            paddingVertical: semantic.space.stack.default,
          }}
        >
          <ThemedText
            align="center"
            className="font-medium"
            numberOfLines={1}
            variant="body"
          >
            {selectedLocationLabel}
          </ThemedText>
          {locationOptions.length > 0 ? (
            <Animated.View style={chevronStyle}>
              <ThemedIcon
                dimension={16}
                name={chevronDownIcon}
                tone="muted"
              />
            </Animated.View>
          ) : null}
        </View>
      </Button>

      {mounted ? (
        <Animated.View
          pointerEvents={locationExpanded ? "auto" : "none"}
          style={containerStyle}
        >
          <View
            style={{
              paddingBottom: semantic.space.stack.compact,
              paddingHorizontal: semantic.space.inline.comfortable,
              alignItems: "center",
              gap: optionGap,
            }}
          >
            {locationOptions.map((option) => {
              const isSelected = option.value === selectedLocationId;
              return (
                <Button
                  key={option.value}
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isSelected }}
                  className="w-full items-center justify-center"
                  onPress={() => {
                    setDefaultLocationId(option.value);
                    setLocationExpanded(false);
                  }}
                  ripple={false}
                  size="none"
                  style={{
                    height: OPTION_ROW_HEIGHT,
                  }}
                  tone="neutral"
                  variant="ghost"
                >
                  <ThemedText
                    align="center"
                    className={isSelected ? "font-semibold" : undefined}
                    tone={isSelected ? "brand" : "default"}
                    variant="body"
                  >
                    {option.label}
                  </ThemedText>
                </Button>
              );
            })}
          </View>
        </Animated.View>
        ) : null}
      </ThemedView>

      <DeleteConfirmationDialog
        confirming={logoutMutation.isPending}
        confirmingLabel="Signing out…"
        confirmLabel="Yes, log out"
        message={logoutMessage}
        onCancel={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        title="Log out"
        visible={logoutVisible}
      />
    </>
  );
}
