import { useEffect, useRef } from "react";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, View } from "react-native";

import { Button, Card, Stack, ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";

const markLogo = require("../../assets/no-text-logo.svg");
const wordmarkLogo = require("../../assets/text-logo.svg");

const checkIcon = {
  ios: "checkmark",
  android: "check",
  web: "check",
} as const;

type LoginSuccessStage = "signingIn" | "syncing" | "ready" | "syncFailed";

type LoginSuccessOverlayProps = {
  stage: LoginSuccessStage;
  isRetrying: boolean;
  onContinue: () => void;
  onRetry: () => void;
  autoContinueMs?: number;
};

export function LoginSuccessOverlay({
  stage,
  isRetrying,
  onContinue,
  onRetry,
  autoContinueMs = 1800,
}: LoginSuccessOverlayProps) {
  const theme = useThemeTokens();
  const didContinueRef = useRef(false);

  const isReady = stage === "ready";
  const isSyncFailed = stage === "syncFailed";
  const isLoading = stage === "signingIn" || stage === "syncing";

  useEffect(() => {
    if (!isReady) {
      return;
    }

    didContinueRef.current = false;
    const t = setTimeout(() => {
      if (!didContinueRef.current) {
        didContinueRef.current = true;
        onContinue();
      }
    }, autoContinueMs);

    return () => clearTimeout(t);
  }, [autoContinueMs, isReady, onContinue]);

  function handleContinue() {
    didContinueRef.current = true;
    onContinue();
  }

  return (
    <View
      className="absolute inset-0 z-overlay items-center justify-center px-inline-default"
      pointerEvents="auto"
      style={{ backgroundColor: "rgba(24, 24, 27, 0.35)" }}
    >
      <Card
        className="w-full items-center"
        style={{
          maxWidth: 360,
          paddingTop: theme.semantic.space.section * 2,
          paddingBottom: theme.semantic.space.section,
          paddingHorizontal: theme.semantic.space.inline.comfortable,
          gap: theme.semantic.space.section,
          overflow: "visible",
        }}
      >
        <View
          className="absolute items-center justify-center"
          style={{
            top: -(theme.semantic.size["control-lg"] + theme.semantic.space.gap.compact),
            width: theme.semantic.size["control-lg"] * 2,
            height: theme.semantic.size["control-lg"] * 2,
            borderRadius: theme.semantic.radius.pill,
            backgroundColor: theme.palette.brand.default,
          }}
        >
          {isReady ? (
            <SymbolView
              name={checkIcon}
              size={theme.semantic.size.icon * 1.5}
              tintColor={theme.palette.brand.text}
            />
          ) : (
            <ActivityIndicator color={theme.palette.brand.text} />
          )}
        </View>

        <Stack align="center" space="comfortable">
          <Stack align="center" space="compact">
            <ThemedText align="center" variant="display">
              {stage === "signingIn"
                ? "Signing in..."
                : stage === "syncing"
                  ? "Preparing workspace..."
                  : "Success!"}
            </ThemedText>
            <View
              style={{
                width: theme.semantic.space.section * 2,
                height: theme.semantic.borderWidth.strong,
                backgroundColor: theme.palette.border.strong,
              }}
            />
            <ThemedText align="center" tone="muted">
              {isSyncFailed
                ? "Unable to finish preparing your clinic data."
                : stage === "signingIn"
                  ? "Please wait while we sign you in."
                  : stage === "syncing"
                    ? "Syncing clinic data with the server..."
                    : "Your app is ready to open."}
            </ThemedText>
          </Stack>

          {isSyncFailed ? (
            <Button
              disabled={isRetrying}
              label={isRetrying ? "Retrying..." : "Retry sync"}
              onPress={onRetry}
              size="lg"
              style={{ minWidth: 160 }}
            />
          ) : isLoading ? (
            <Stack align="center" space="compact">
              <ActivityIndicator color={theme.palette.brand.default} />
              <ThemedText align="center" tone="muted" variant="label">
                {stage === "signingIn" ? "Signing in..." : "Syncing..."}
              </ThemedText>
            </Stack>
          ) : (
            <Button
              label="Continue"
              onPress={handleContinue}
              size="lg"
              style={{ minWidth: 160 }}
            />
          )}
        </Stack>

        <View className="items-center">
          <Image
            accessibilityLabel="Dentrooper 360"
            contentFit="contain"
            source={wordmarkLogo}
            style={{ width: 120, height: 18 }}
          />
          <Image
            accessibilityLabel="Dentrooper 360 mark"
            contentFit="contain"
            source={markLogo}
            style={{
              position: "absolute",
              left: -18,
              top: 0,
              width: 14,
              height: 18,
            }}
          />
        </View>
      </Card>
    </View>
  );
}
