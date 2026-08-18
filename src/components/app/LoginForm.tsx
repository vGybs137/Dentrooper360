import { useMutation } from "@tanstack/react-query";
import { type Href, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { login } from "@/api";
import { Button, Stack, TextField, ThemedText } from "@/components/ui";
import { useStartupSync } from "@/hooks/useStartupSync";
import { useCustomerId } from "@/stores";
import { useThemeTokens } from "@/theme";
import { ApiError } from "@/types/api";

import { useSplashFooterOffset } from "./BrandLogo";

type LoginFormProps = {
  logo?: ReactNode;
  contentStyle?: ComponentProps<typeof Animated.View>["style"];
  onFieldsLayout?: (height: number) => void;
};

export function LoginForm({
  logo,
  contentStyle,
  onFieldsLayout,
}: LoginFormProps) {
  const router = useRouter();
  const customerId = useCustomerId();
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const footerOffset = useSplashFooterOffset();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const fieldGap = theme.semantic.space.section;
  const inline = theme.semantic.space.inline.comfortable;

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

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingTop: insets.top + theme.semantic.space.page,
        }}
      >
        {logo}
        <Animated.View
          style={[
            {
              paddingHorizontal: inline,
              paddingTop: fieldGap,
            },
            contentStyle,
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
      </View>
      <Animated.View
        onLayout={(event) => {
          onFieldsLayout?.(event.nativeEvent.layout.height);
        }}
        style={[
          {
            paddingHorizontal: inline,
            paddingVertical: fieldGap,
          },
          contentStyle,
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
                    web: isPasswordVisible ? "visibility_off" : "visibility",
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
          {
            flex: 1,
            paddingHorizontal: inline,
            paddingBottom: footerOffset,
          },
          contentStyle,
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
    </View>
  );
}
