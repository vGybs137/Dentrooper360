import { useSegments, type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, View } from "react-native";

import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import { lockIcon } from "@/constants";
import { authenticateDeviceOwner } from "@/security/biometric/deviceAuth";
import {
  useAppLockHasHydrated,
  useAppLockStore,
} from "@/stores/appLockStore";
import { useAuthStore } from "@/stores/authStore";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

function hasRestorableSession(
  accessToken: string | null,
  user: unknown,
  customerId: string | null,
  hasRefreshCredential: boolean,
): boolean {
  if (accessToken && user) {
    return true;
  }

  return Boolean(hasRefreshCredential && user && customerId);
}

export function AppLockOverlay() {
  const { t } = useTranslation(["auth", "a11y"]);
  const router = useRouter();
  const segments = useSegments();
  const native = useNativeColors();
  const hasHydrated = useAppLockHasHydrated();
  const enabled = useAppLockStore((state) => state.enabled);
  const isLocked = useAppLockStore((state) => state.isLocked);
  const passwordFallback = useAppLockStore((state) => state.passwordFallback);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const customerId = useAuthStore((state) => state.customerId);
  const hasRefreshCredential = useAuthStore((state) => state.hasRefreshCredential);
  const [isPrompting, setIsPrompting] = useState(false);
  const promptGeneration = useRef(0);

  const onAuthRoute = segments[0] === "(auth)";
  const sessionPresent = hasRestorableSession(
    accessToken,
    user,
    customerId,
    hasRefreshCredential,
  );
  const visible =
    hasHydrated &&
    enabled &&
    isLocked &&
    sessionPresent &&
    !(passwordFallback && onAuthRoute);

  const prompt = useCallback(async () => {
    const generation = promptGeneration.current + 1;
    promptGeneration.current = generation;
    setIsPrompting(true);

    try {
      const unlocked = await authenticateDeviceOwner(t("auth:lock.prompt"));
      if (promptGeneration.current !== generation) {
        return;
      }
      if (useAppLockStore.getState().passwordFallback) {
        return;
      }
      if (unlocked) {
        useAppLockStore.getState().markUnlocked();
      }
    } finally {
      if (promptGeneration.current === generation) {
        setIsPrompting(false);
      }
    }
  }, [t]);

  const promptRef = useRef(prompt);
  promptRef.current = prompt;

  useEffect(() => {
    if (!visible) {
      return;
    }

    void promptRef.current();
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" statusBarTranslucent visible>
      <View
        accessibilityLabel={t("a11y:unlockClinic")}
        accessibilityViewIsModal
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: native.surface.default,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: semantic.space.inline.comfortable,
            gap: semantic.space.gap.default,
          },
        ]}
      >
        <ThemedIcon name={lockIcon} size="lg" tone="brand" />
        <ThemedText align="center" className="font-semibold" variant="title">
          {t("auth:lock.title")}
        </ThemedText>
        <ThemedText align="center" tone="muted" variant="body">
          {t("auth:lock.message")}
        </ThemedText>
        <Button
          disabled={isPrompting}
          label={isPrompting ? t("auth:lock.unlocking") : t("auth:lock.unlock")}
          onPress={() => {
            void prompt();
          }}
          tone="brand"
        />
        <Button
          label={t("auth:lock.usePassword")}
          onPress={() => {
            promptGeneration.current += 1;
            useAppLockStore.getState().requestPasswordFallback();
            router.replace("/(auth)/login" as Href);
          }}
          tone="neutral"
          variant="ghost"
        />
      </View>
    </Modal>
  );
}
