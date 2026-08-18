import { useMutation } from "@tanstack/react-query";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { login } from "@/api";
import { BrandLogo, SplashFooter, useSplashFooterOffset } from "@/components/app/BrandLogo";
import {
  Button,
  Stack,
  TextField,
  ThemedText,
  ThemedView,
} from "@/components/ui";
import { hideNativeSplash } from "@/helpers/nativeSplash";
import { useSplashIntro } from "@/hooks/useSplashIntro";
import { useStartupSync } from "@/hooks/useStartupSync";
import { useCustomerId } from "@/stores";
import { useThemeTokens } from "@/theme";
import { ApiError } from "@/types/api";

function isIntroParam(value: string | string[] | undefined) {
  return value === "1" || value?.[0] === "1";
}

export default function LoginScreen() {
  const router = useRouter();
  const { intro } = useLocalSearchParams<{ intro?: string | string[] }>();
  const animateFromSplash = isIntroParam(intro);
  const customerId = useCustomerId();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const splashIntro = useSplashIntro(animateFromSplash);
  const footerOffset = useSplashFooterOffset();
  const logoHeight = useSharedValue(0);
  const logoRestY = useSharedValue(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasSignedIn, setHasSignedIn] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => {
      if (!customerId) {
        throw new ApiError(
          "Pair this device with a clinic before signing in.",
          400,
        );
      }

      return login({
        customerId,
        username: username.trim(),
        password,
      });
    },
    onSuccess: () => {
      setHasSignedIn(true);
    },
  });

  const {
    isPending: isSyncing,
    isSuccess: isSyncComplete,
    isError: isSyncFailed,
    isFetchedAfterMount: hasSyncedThisVisit,
    refetch: retrySync,
    isFetching: isRetryingSync,
  } = useStartupSync(hasSignedIn);

  useEffect(() => {
    void hideNativeSplash();

    if (animateFromSplash) {
      splashIntro.start();
    }
    // start() is guarded by a shared value, so it is safe across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run for the splash intro
  }, [animateFromSplash]);

  useEffect(() => {
    if (
      !hasSignedIn ||
      isSyncFailed ||
      !hasSyncedThisVisit ||
      !isSyncComplete
    ) {
      return;
    }

    router.replace("/(tabs)/schedule" as Href);
  }, [hasSignedIn, hasSyncedThisVisit, isSyncComplete, isSyncFailed, router]);

  const isSigningIn = loginMutation.isPending;
  const isSyncingNow =
    hasSignedIn && (isSyncing || isRetryingSync || !hasSyncedThisVisit);
  const canSubmit =
    Boolean(customerId) &&
    username.trim().length > 0 &&
    password.length > 0 &&
    !isSigningIn &&
    !hasSignedIn;
  const loginError =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.isError
        ? "Unable to sign in. Check your credentials and try again."
        : undefined;

  const logoStyle = useAnimatedStyle(() => {
    if (!animateFromSplash || logoHeight.value === 0) {
      return { transform: [{ translateY: 0 }] };
    }

    const centeredTop = (windowHeight - logoHeight.value) / 2;
    const offset = Math.max(centeredTop - logoRestY.value, 0);

    return {
      transform: [{ translateY: (1 - splashIntro.progress.value) * offset }],
    };
  });

  const incomingStyle = useAnimatedStyle(() => {
    if (!animateFromSplash) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }

    return {
      opacity: interpolate(
        splashIntro.progress.value,
        [0, 0.2],
        [0, 1],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateY: (1 - splashIntro.progress.value) * windowHeight,
        },
      ],
    };
  });

  const fieldGap = theme.semantic.space.section;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ThemedView surface="sunken" style={styles.root}>
        <Animated.View
          style={[
            styles.top,
            {
              paddingTop: insets.top + theme.semantic.space.page,
            },
          ]}
        >
          <Animated.View
            onLayout={(event) => {
              logoHeight.value = event.nativeEvent.layout.height;
              logoRestY.value = event.nativeEvent.layout.y;
            }}
            style={[styles.logo, logoStyle]}
          >
            <BrandLogo
              showWordmark={animateFromSplash}
              wordmarkStyle={splashIntro.wordmarkStyle}
            />
          </Animated.View>
          <Animated.View
            style={[
              {
                paddingHorizontal: theme.semantic.space.inline.comfortable,
                paddingTop: fieldGap,
                opacity: animateFromSplash ? 0 : 1,
              },
              incomingStyle,
            ]}
          >
            <Stack space="compact">
              <ThemedText align="center" variant="display">
                Welcome back!
              </ThemedText>
              <ThemedText align="center" tone="muted">
                Please enter your details.
              </ThemedText>
            </Stack>
          </Animated.View>
        </Animated.View>
        <Animated.View
          onLayout={(event) => {
            splashIntro.onContentLayout(event.nativeEvent.layout.height);
          }}
          style={[
            {
              paddingHorizontal: theme.semantic.space.inline.comfortable,
              paddingVertical: fieldGap,
              opacity: animateFromSplash ? 0 : 1,
            },
            incomingStyle,
          ]}
        >
          <Stack space="default">
            {!customerId ? (
              <Stack space="compact">
                <ThemedText align="center" tone="muted">
                  Pair this device with a clinic QR code before signing in.
                </ThemedText>
                <Button
                  label="Scan clinic QR"
                  onPress={() => router.replace("/(auth)/qr-scanner" as Href)}
                  tone="brand"
                  variant="outline"
                />
              </Stack>
            ) : null}
            <TextField
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              editable={!isSigningIn && !hasSignedIn}
              leading={
                <SymbolView
                  name={{
                    ios: "person.crop.circle",
                    android: "account_circle",
                    web: "account_circle",
                  }}
                  size={theme.semantic.size.icon}
                  tintColor={theme.palette.foreground.muted}
                />
              }
              onChangeText={setUsername}
              placeholder="Username"
              size="lg"
              textContentType="username"
              value={username}
            />
            <TextField
              autoComplete="password"
              editable={!isSigningIn && !hasSignedIn}
              leading={
                <SymbolView
                  name={{
                    ios: "lock.fill",
                    android: "lock",
                    web: "lock",
                  }}
                  size={theme.semantic.size.icon}
                  tintColor={theme.palette.foreground.muted}
                />
              }
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!isPasswordVisible}
              size="lg"
              textContentType="password"
              trailing={
                <Pressable
                  accessibilityLabel={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                  accessibilityRole="button"
                  hitSlop={theme.semantic.space.inset.compact}
                  onPress={() => {
                    setIsPasswordVisible((visible) => !visible);
                  }}
                >
                  <SymbolView
                    name={{
                      ios: isPasswordVisible ? "eye.slash" : "eye",
                      android: isPasswordVisible
                        ? "visibility_off"
                        : "visibility",
                      web: isPasswordVisible
                        ? "visibility_off"
                        : "visibility",
                    }}
                    size={theme.semantic.size.icon}
                    tintColor={theme.palette.foreground.muted}
                  />
                </Pressable>
              }
              value={password}
            />
            {loginError ? (
              <ThemedText align="center" tone="alert">
                {loginError}
              </ThemedText>
            ) : null}
          </Stack>
        </Animated.View>
        <Animated.View
          style={[
            styles.bottom,
            {
              paddingHorizontal: theme.semantic.space.inline.comfortable,
              paddingBottom: footerOffset,
              opacity: animateFromSplash ? 0 : 1,
            },
            incomingStyle,
          ]}
        >
          {hasSignedIn ? (
            <Stack space="compact">
              <ThemedText align="center" tone="muted">
                {isSyncFailed
                  ? "Unable to sync clinic data. Check your connection and try again."
                  : isSyncingNow
                    ? "Syncing clinic data with the server..."
                    : "Sync complete. Opening the app..."}
              </ThemedText>
              {isSyncFailed ? (
                <Button
                  disabled={isRetryingSync}
                  label={isRetryingSync ? "Retrying sync..." : "Retry sync"}
                  onPress={() => {
                    void retrySync();
                  }}
                  size="lg"
                  tone="brand"
                />
              ) : null}
            </Stack>
          ) : (
            <Button
              disabled={!canSubmit}
              label={isSigningIn ? "Signing in..." : "Login"}
              onPress={() => {
                loginMutation.mutate();
              }}
              size="lg"
            />
          )}
        </Animated.View>
        <SplashFooter />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
    overflow: "hidden",
  },
  top: {
    flex: 1,
    justifyContent: "flex-end",
  },
  logo: {
    alignItems: "center",
  },
  bottom: {
    flex: 1,
  },
});
