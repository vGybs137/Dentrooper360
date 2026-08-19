import { SymbolView } from "expo-symbols";
import { type ComponentProps, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Stack, TextField, ThemedText } from "@/components/ui";
import { lockIcon, personIcon, visibilityIcon } from "@/constants";
import { useLoginForm } from "@/hooks/useLoginForm";
import { useThemeTokens } from "@/theme";

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
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const footerOffset = useSplashFooterOffset();
  const form = useLoginForm();

  return (
    <View className="flex-1">
      <View
        className="flex-1 justify-end"
        style={{ paddingTop: insets.top + theme.semantic.space.page }}
      >
        {logo}
        <Animated.View
          className="px-inline-comfortable pt-section"
          style={contentStyle}
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
        className="px-inline-comfortable py-section"
        onLayout={(event) => {
          onFieldsLayout?.(event.nativeEvent.layout.height);
        }}
        style={contentStyle}
      >
        <Stack space="default">
          {!form.customerId ? (
            <Stack space="compact">
              <ThemedText align="center" tone="muted">
                Pair this device with a clinic QR code before signing in.
              </ThemedText>
              <Button
                label="Scan clinic QR"
                onPress={form.goToQrScanner}
                tone="brand"
                variant="outline"
              />
            </Stack>
          ) : null}
          <TextField
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            editable={!form.isSigningIn && !form.hasSignedIn}
            leading={
              <SymbolView
                name={personIcon}
                size={theme.semantic.size.icon}
                tintColor={theme.palette.foreground.muted}
              />
            }
            onChangeText={form.setUsername}
            placeholder="Username"
            size="lg"
            textContentType="username"
            value={form.username}
          />
          <TextField
            autoComplete="password"
            editable={!form.isSigningIn && !form.hasSignedIn}
            leading={
              <SymbolView
                name={lockIcon}
                size={theme.semantic.size.icon}
                tintColor={theme.palette.foreground.muted}
              />
            }
            onChangeText={form.setPassword}
            placeholder="Password"
            secureTextEntry={!form.isPasswordVisible}
            size="lg"
            textContentType="password"
            trailing={
              <Pressable
                accessibilityLabel={
                  form.isPasswordVisible ? "Hide password" : "Show password"
                }
                accessibilityRole="button"
                hitSlop={theme.semantic.space.inset.compact}
                onPress={form.togglePasswordVisibility}
              >
                <SymbolView
                  name={visibilityIcon(form.isPasswordVisible)}
                  size={theme.semantic.size.icon}
                  tintColor={theme.palette.foreground.muted}
                />
              </Pressable>
            }
            value={form.password}
          />
          {form.loginError ? (
            <ThemedText align="center" tone="alert">
              {form.loginError}
            </ThemedText>
          ) : null}
        </Stack>
      </Animated.View>
      <Animated.View
        className="flex-1 px-inline-comfortable"
        style={[{ paddingBottom: footerOffset }, contentStyle]}
      >
        {form.hasSignedIn ? (
          <Stack space="compact">
            <ThemedText align="center" tone="muted">
              {form.isSyncFailed
                ? "Unable to sync clinic data. Check your connection and try again."
                : form.isSyncingNow
                  ? "Syncing clinic data with the server..."
                  : "Sync complete. Opening the app..."}
            </ThemedText>
            {form.isSyncFailed ? (
              <Button
                disabled={form.isRetryingSync}
                label={form.isRetryingSync ? "Retrying sync..." : "Retry sync"}
                onPress={form.retrySync}
                size="lg"
                tone="brand"
              />
            ) : null}
          </Stack>
        ) : (
          <Button
            disabled={!form.canSubmit}
            label={form.isSigningIn ? "Signing in..." : "Login"}
            onPress={form.submit}
            size="lg"
          />
        )}
      </Animated.View>
    </View>
  );
}
