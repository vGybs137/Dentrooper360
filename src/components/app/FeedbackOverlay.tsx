import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Button, Card, Stack, ThemedText } from "@/components/ui";
import { useThemeTokens } from "@/theme";

const markLogo = require("../../assets/no-text-logo.svg");
const wordmarkLogo = require("../../assets/text-logo.svg");

const checkIcon = {
  ios: "checkmark",
  android: "check",
  web: "check",
} as const;

const errorIcon = {
  ios: "xmark",
  android: "close",
  web: "close",
} as const;

export type FeedbackOverlayStage = "loading" | "success" | "error";

export type FeedbackOverlayProps = {
  stage: FeedbackOverlayStage;
  title: string;
  message: string;
  onContinue?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  autoContinueMs?: number;
  autoDismissMs?: number;
  continueLabel?: string;
  retryLabel?: string;
};

export function FeedbackOverlay({
  stage,
  title,
  message,
  onContinue,
  onRetry,
  onDismiss,
  isRetrying = false,
  autoContinueMs = 1800,
  autoDismissMs = autoContinueMs,
  continueLabel = "Continue",
  retryLabel = "Try again",
}: FeedbackOverlayProps) {
  const theme = useThemeTokens();
  const didAutoActionRef = useRef(false);

  const isSuccess = stage === "success";
  const isError = stage === "error";

  const badgeSize = theme.semantic.size["control-lg"];
  const badgeIconSize = theme.semantic.size.icon * 1.2;
  const tickMs = theme.semantic.motion.enter.duration;
  const badgeProgress = useSharedValue(0);

  const badgeColor = isError
    ? theme.palette.alert.DEFAULT
    : theme.palette.brand.default;

  useEffect(() => {
    if (!isSuccess && !isError) {
      badgeProgress.value = 0;
      return;
    }

    badgeProgress.value = 0;
    badgeProgress.value = withTiming(1, {
      duration: tickMs,
      easing: Easing.out(Easing.cubic),
    });

    return () => {
      cancelAnimation(badgeProgress);
    };
  }, [badgeProgress, isError, isSuccess, tickMs]);

  const badgeIconStyle = useAnimatedStyle(() => ({
    opacity: badgeProgress.value,
    transform: [{ scale: interpolate(badgeProgress.value, [0, 1], [0.72, 1]) }],
  }));

  useEffect(() => {
    if (!isSuccess || !onContinue) {
      return;
    }

    didAutoActionRef.current = false;
    const t = setTimeout(() => {
      if (!didAutoActionRef.current) {
        didAutoActionRef.current = true;
        onContinue();
      }
    }, autoContinueMs);

    return () => clearTimeout(t);
  }, [autoContinueMs, isSuccess, onContinue]);

  useEffect(() => {
    if (!isError || !onDismiss) {
      return;
    }

    didAutoActionRef.current = false;
    const t = setTimeout(() => {
      if (!didAutoActionRef.current) {
        didAutoActionRef.current = true;
        onDismiss();
      }
    }, autoDismissMs);

    return () => clearTimeout(t);
  }, [autoDismissMs, isError, onDismiss]);

  function handleContinue() {
    didAutoActionRef.current = true;
    onContinue?.();
  }

  function handleRetry() {
    didAutoActionRef.current = true;
    onRetry?.();
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
          paddingTop: theme.semantic.space.section * 1.4,
          paddingBottom: theme.semantic.space.section,
          paddingHorizontal: theme.semantic.space.inline.comfortable,
          gap: theme.semantic.space.section,
          overflow: "visible",
        }}
      >
        <View
          className="absolute items-center justify-center"
          style={{
            top: -((badgeSize * 1.4) / 2 + theme.semantic.space.gap.compact),
            width: badgeSize * 1.4,
            height: badgeSize * 1.4,
            borderRadius: theme.semantic.radius.pill,
            backgroundColor: badgeColor,
          }}
        >
          {isSuccess ? (
            <Animated.View style={badgeIconStyle}>
              <SymbolView
                name={checkIcon}
                size={badgeIconSize}
                tintColor={theme.palette.brand.text}
              />
            </Animated.View>
          ) : isError ? (
            <Animated.View style={badgeIconStyle}>
              <SymbolView
                name={errorIcon}
                size={badgeIconSize}
                tintColor={theme.palette.alert.text}
              />
            </Animated.View>
          ) : (
            <ActivityIndicator color={theme.palette.brand.text} size="small" />
          )}
        </View>

        <Stack align="center" space="comfortable">
          <Stack
            align="center"
            space="comfortable"
            style={{ paddingTop: theme.semantic.space.gap.default * 0.8 }}
          >
            <ThemedText align="center" variant="display">
              {title}
            </ThemedText>
            <View
              style={{
                width: theme.semantic.space.section * 4,
                height: theme.semantic.borderWidth.strong,
                backgroundColor: theme.palette.border.strong,
              }}
            />
            <ThemedText align="center" tone={isError ? "alert" : "muted"}>
              {message}
            </ThemedText>
          </Stack>
        </Stack>

        <View
          style={{
            minHeight: theme.semantic.size.control,
            minWidth: 130,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isError ? (
            <Button
              disabled={isRetrying}
              label={isRetrying ? "Retrying..." : retryLabel}
              onPress={handleRetry}
              size="md"
              style={{ minWidth: 130 }}
              tone="brand"
            />
          ) : isSuccess ? (
            <Button
              label={continueLabel}
              onPress={handleContinue}
              size="md"
              style={{ minWidth: 130 }}
            />
          ) : null}
        </View>

        <View className="items-center">
          <Image
            accessibilityLabel="Dentrooper 360"
            contentFit="contain"
            source={wordmarkLogo}
            style={{ width: 150, height: 22 }}
          />
          <Image
            accessibilityLabel="Dentrooper 360 mark"
            contentFit="contain"
            source={markLogo}
            style={{
              position: "absolute",
              left: -26,
              top: 1,
              width: 26,
              height: 26,
            }}
          />
        </View>
      </Card>
    </View>
  );
}
