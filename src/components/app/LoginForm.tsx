import { type ComponentProps, type ReactNode } from "react";
import { FormProvider } from "react-hook-form";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { lockIcon, personIcon, visibilityIcon } from "@/constants";
import { useLoginForm, type LoginFormState } from "@/hooks/useLoginForm";
import { semantic } from "@/tokens";

import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "./FeedbackOverlay";
import { useSplashFooterOffset } from "./BrandLogo";

function getLoginFeedbackOverlay(
  form: LoginFormState,
): FeedbackOverlayProps | null {
  if (form.isSigningIn) {
    return {
      stage: "loading",
      title: "Signing in...",
      message: "Please wait while we sign you in.",
    };
  }

  if (form.loginError && !form.hasSignedIn) {
    return {
      stage: "error",
      title: "Sign-in failed",
      message: form.loginError,
      onRetry: form.dismissLoginError,
      onDismiss: form.dismissLoginError,
    };
  }

  if (form.isSyncFailed) {
    return {
      stage: "error",
      title: "Sync failed",
      message: "Unable to finish preparing your clinic data.",
      onRetry: form.retrySync,
      isRetrying: form.isRetryingSync,
    };
  }

  if (form.isAppReady) {
    return {
      stage: "success",
      title: "Success!",
      message: "Your app is ready to open.",
      onContinue: form.continueToApp,
    };
  }

  if (form.isSyncingNow) {
    return {
      stage: "loading",
      title: "Preparing workspace...",
      message: "Syncing clinic data with the server.",
    };
  }

  return null;
}

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
  const insets = useSafeAreaInsets();
  const footerOffset = useSplashFooterOffset();
  const login = useLoginForm();
  const { formState } = login.form;
  const fieldsEditable = !login.isSigningIn && !login.hasSignedIn;
  const canSubmit =
    Boolean(login.customerId) &&
    formState.isValid &&
    !login.isSigningIn &&
    !login.hasSignedIn;

  return (
    <FormProvider {...login.form}>
      <View className="flex-1">
      <View
        className="flex-1 justify-end"
        style={{ paddingTop: insets.top + semantic.space.page }}
      >
        {logo}
        <Animated.View
          className="px-inline-comfortable pt-section"
          style={contentStyle}
        >
          <ThemedView space="compact" variant="stack">
            <ThemedText align="center" variant="display">
              Welcome back!
            </ThemedText>
            <ThemedText align="center" tone="muted">
              Please enter your details.
            </ThemedText>
          </ThemedView>
        </Animated.View>
      </View>
      <Animated.View
        className="px-inline-comfortable py-section"
        onLayout={(event) => {
          onFieldsLayout?.(event.nativeEvent.layout.height);
        }}
        style={contentStyle}
      >
        <ThemedView space="default" variant="stack">
          {!login.customerId ? (
            <ThemedView space="compact" variant="stack">
              <ThemedText align="center" tone="muted">
                Pair this device with a clinic QR code before signing in.
              </ThemedText>
              <Button
                label="Scan clinic QR"
                onPress={login.goToQrScanner}
                tone="brand"
                variant="outline"
              />
            </ThemedView>
          ) : null}
          <ThemedText
            as="input"
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            editable={fieldsEditable}
            leading={
              <ThemedIcon name={personIcon} tone="muted" />
            }
            name="username"
            placeholder="Username"
            rules={{ required: true }}
            size="lg"
            textContentType="username"
          />
          <ThemedText
            as="input"
            autoComplete="password"
            editable={fieldsEditable}
            leading={
              <ThemedIcon name={lockIcon} tone="muted" />
            }
            name="password"
            placeholder="Password"
            rules={{ required: true }}
            secureTextEntry={!login.isPasswordVisible}
            size="lg"
            textContentType="password"
            trailing={
              <Button
                accessibilityLabel={
                  login.isPasswordVisible
                    ? "Hide password"
                    : "Show password"
                }
                hitSlop={semantic.space.inset.compact}
                onPress={login.togglePasswordVisibility}
                size="sm"
                tone="neutral"
                variant="ghost"
              >
                <ThemedIcon
                  name={visibilityIcon(login.isPasswordVisible)}
                  tone="muted"
                />
              </Button>
            }
          />
        </ThemedView>
      </Animated.View>
      <Animated.View
        className="flex-1 px-inline-comfortable"
        style={[{ paddingBottom: footerOffset }, contentStyle]}
      >
        {!login.hasSignedIn ? (
          <Button
            disabled={!canSubmit}
            label={login.isSigningIn ? "Signing in..." : "Login"}
            onPress={login.submit}
            size="lg"
          />
        ) : null}
      </Animated.View>
      {(() => {
        const overlay = getLoginFeedbackOverlay(login);

        if (!overlay) {
          return null;
        }

        return <FeedbackOverlay {...overlay} />;
      })()}
      </View>
    </FormProvider>
  );
}
