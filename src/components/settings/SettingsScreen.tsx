import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Href, useRouter, useSegments } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { logout } from "@/api";
import { Button, DeleteConfirmationDialog, ThemedText, ThemedView } from "@/components/ui";
import { getWebTabBarInset } from "@/constants/navigation";
import { useSyncStatus } from "@/hooks/sync/useSyncStatus";
import { semantic } from "@/tokens";
import { ApiError } from "@/types/api";

import { SettingsPreferencesSection } from "./SettingsPreferencesSection";
import { SettingsSecuritySection } from "./SettingsSecuritySection";
import { SettingsProfileCard } from "./SettingsProfileCard";
import { SettingsSyncSection } from "./SettingsSyncSection";

export function SettingsScreen() {
  const { t } = useTranslation(["settings", "a11y"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const segments = useSegments();
  const scrollY = useSharedValue(0);
  const { hasUnsynced } = useSyncStatus();
  const [logoutVisible, setLogoutVisible] = useState(false);

  const bottomInset = getWebTabBarInset(segments[0]);

  const titleTopPadding = semantic.space.section * 2;
  const titleBottomPadding = semantic.space.section;
  const displayLineHeight = semantic.type.display.lineHeight;
  const titleBlockHeight =
    titleTopPadding + displayLineHeight + titleBottomPadding;

  const contentBottomPadding = semantic.space.page + bottomInset;

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
        ? t("settings:profile.logoutError")
        : undefined;

  const logoutMessage = hasUnsynced
    ? t("settings:profile.logoutMessageUnsynced")
    : t("settings:profile.logoutMessage");

  const canLogout = !logoutMutation.isPending;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Fade as the large title collapses — same scroll distance Search uses
  // to pin the back chevron (title block height).
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, titleBlockHeight],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <ThemedView
      edges={["top", "left", "right"]}
      inset="none"
      padBottom={false}
      scroll={false}
      variant="screen"
    >
      <Animated.ScrollView
        contentContainerStyle={{
          paddingBottom: contentBottomPadding,
          paddingHorizontal: semantic.space.inline.compact,
        }}
        keyboardShouldPersistTaps="handled"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            {
              paddingTop: titleTopPadding,
              paddingBottom: titleBottomPadding,
            },
            titleAnimatedStyle,
          ]}
        >
          <ThemedText align="center" variant="display">
            {t("settings:title")}
          </ThemedText>
        </Animated.View>

        <ThemedView
          space="comfortable"
          style={{ marginTop: semantic.space.section }}
          variant="stack"
        >
          <SettingsProfileCard />
          <SettingsSecuritySection />
          <SettingsPreferencesSection />
          <SettingsSyncSection />

          <Button
            accessibilityLabel={t("a11y:logOut")}
            accessibilityState={{ disabled: !canLogout }}
            disabled={!canLogout}
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
            textClassName="font-semibold"
            tone="alert"
            variant="ghost"
          />
          {logoutError ? (
            <ThemedText align="center" tone="alert" variant="label">
              {logoutError}
            </ThemedText>
          ) : null}
        </ThemedView>
      </Animated.ScrollView>

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
    </ThemedView>
  );
}
