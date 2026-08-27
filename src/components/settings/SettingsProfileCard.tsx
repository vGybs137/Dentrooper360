import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { logout } from "@/api";
import { DeleteConfirmationDialog, ThemedText, ThemedView } from "@/components/ui";
import { chevronDownIcon, logoutIcon } from "@/constants";
import { useAppointmentFormOptions } from "@/hooks/useAppointmentFormOptions";
import { useInlineCollapse } from "@/hooks/useInlineCollapse";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import {
  resolveDefaultLocationId,
  useAuthUser,
  useSchedulePreferencesStore,
} from "@/stores";
import { useThemeTokens } from "@/theme";
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
  const theme = useThemeTokens();
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

  const optionGap = theme.semantic.space.gap.compact;
  const contentHeight =
    locationOptions.length * OPTION_ROW_HEIGHT +
    Math.max(locationOptions.length - 1, 0) * optionGap +
    theme.semantic.space.stack.compact;
  const { containerStyle, mounted } = useInlineCollapse(
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
      <View
      style={{
        borderRadius: theme.semantic.radius.card,
        backgroundColor: theme.palette.surface.raised,
        borderWidth: 1,
        borderColor: theme.palette.border.subtle,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: theme.semantic.space.gap.default,
          paddingHorizontal: theme.semantic.space.inline.comfortable,
          paddingVertical: theme.semantic.space.stack.default,
        }}
      >
        <View
          style={{
            width: theme.semantic.size.touch,
            height: theme.semantic.size.touch,
            borderRadius: theme.semantic.radius.pill,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: theme.palette.brand.subtle,
          }}
        >
          <ThemedText
            tone="brand"
            variant="body"
            style={{ fontWeight: theme.primitives.fontWeight.semibold }}
          >
            {initialsFromName(displayName)}
          </ThemedText>
        </View>

        <ThemedView space="compact" style={{ flex: 1, minWidth: 0 }} variant="stack">
          <ThemedText
            numberOfLines={1}
            variant="body"
            style={{ fontWeight: theme.primitives.fontWeight.semibold }}
          >
            {displayName}
          </ThemedText>
          <ThemedText numberOfLines={1} tone="muted" variant="label">
            {logoutMutation.isPending
              ? "Signing out…"
              : (displayEmail ?? "Clinic pairing stays on this device")}
          </ThemedText>
        </ThemedView>

        <Pressable
          accessibilityLabel="Log out"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canLogout }}
          disabled={!canLogout}
          hitSlop={8}
          onPress={requestLogout}
          style={{
            width: theme.semantic.size.touch,
            height: theme.semantic.size.touch,
            alignItems: "center",
            justifyContent: "center",
            opacity: canLogout ? 1 : 0.4,
          }}
        >
          <SymbolView
            name={logoutIcon}
            size={theme.semantic.size.icon}
            tintColor={
              canLogout
                ? theme.palette.alert.DEFAULT
                : theme.palette.foreground.muted
            }
          />
        </Pressable>
      </View>

      {logoutError ? (
        <View
          style={{
            paddingHorizontal: theme.semantic.space.inline.comfortable,
            paddingBottom: theme.semantic.space.stack.compact,
          }}
        >
          <ThemedText tone="alert" variant="label">
            {logoutError}
          </ThemedText>
        </View>
      ) : null}

      <View
        style={{
          height: 1,
          backgroundColor: theme.palette.border.subtle,
          marginHorizontal: theme.semantic.space.inline.comfortable,
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          expanded: locationExpanded,
          disabled: locationOptions.length === 0,
        }}
        disabled={locationOptions.length === 0}
        onPress={() => setLocationExpanded((current) => !current)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.semantic.space.gap.compact,
          paddingHorizontal: theme.semantic.space.inline.comfortable,
          paddingVertical: theme.semantic.space.stack.default,
          minHeight: theme.semantic.size.touch,
        }}
      >
        <ThemedText
          align="center"
          numberOfLines={1}
          variant="body"
          style={{ fontWeight: theme.primitives.fontWeight.medium }}
        >
          {selectedLocationLabel}
        </ThemedText>
        {locationOptions.length > 0 ? (
          <SymbolView
            name={chevronDownIcon}
            size={16}
            style={{
              transform: [{ rotate: locationExpanded ? "180deg" : "0deg" }],
            }}
            tintColor={theme.palette.foreground.muted}
          />
        ) : null}
      </Pressable>

      {mounted ? (
        <Animated.View
          pointerEvents={locationExpanded ? "auto" : "none"}
          style={containerStyle}
        >
          <View
            style={{
              paddingBottom: theme.semantic.space.stack.compact,
              paddingHorizontal: theme.semantic.space.inline.comfortable,
              alignItems: "center",
              gap: optionGap,
            }}
          >
            {locationOptions.map((option) => {
              const isSelected = option.value === selectedLocationId;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    setDefaultLocationId(option.value);
                    setLocationExpanded(false);
                  }}
                  style={{
                    height: OPTION_ROW_HEIGHT,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ThemedText
                    align="center"
                    tone={isSelected ? "brand" : "default"}
                    variant="body"
                    style={{
                      fontWeight: isSelected
                        ? theme.primitives.fontWeight.semibold
                        : theme.primitives.fontWeight.regular,
                    }}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
        ) : null}
      </View>

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
