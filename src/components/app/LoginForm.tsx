import { type ComponentProps, type ReactNode, useEffect, useState } from "react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { View, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PatientFormFieldRow } from "@/components/patients/addPatient/PatientFormField";
import { Button, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { fingerprintIcon, lockIcon, personIcon, visibilityIcon } from "@/constants";
import { useLoginForm, type LoginFormState } from "@/hooks/auth/useLoginForm";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "./FeedbackOverlay";
import { useSplashFooterOffset } from "./BrandLogo";

function LoginFieldShell({
  focused,
  children,
}: {
  focused: boolean;
  children: ReactNode;
}) {
  const native = useNativeColors();
  const trackWidth = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: semantic.motion.fast.duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, progress]);

  const highlightStyle = useAnimatedStyle(() => {
    const diameter = progress.value * trackWidth.value;
    return {
      width: diameter,
      height: diameter,
      borderRadius: diameter / 2,
      opacity: progress.value > 0 ? 1 : 0,
    };
  });

  return (
    <View className="pb-stack-compact">
      {children}
      <View
        className="mt-stack-compact h-0.5 items-center justify-center overflow-hidden"
        onLayout={(event) => {
          trackWidth.value = event.nativeEvent.layout.width;
        }}
      >
        <View
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ backgroundColor: native.border.subtle }}
        />
        <Animated.View
          style={[
            {
              backgroundColor: native.border.focus,
            },
            highlightStyle,
          ]}
        />
      </View>
    </View>
  );
}

function getLoginFeedbackOverlay(
  form: LoginFormState,
  t: (key: string) => string,
): FeedbackOverlayProps | null {
  if (form.isSigningIn) {
    return {
      stage: "loading",
      title: t("auth:login.feedback.signingInTitle"),
      message: t("auth:login.feedback.signingInMessage"),
    };
  }

  if (form.loginError && !form.hasSignedIn) {
    return {
      stage: "error",
      title: t("auth:login.feedback.signInFailed"),
      message: form.loginError,
      onRetry: form.dismissLoginError,
      onDismiss: form.dismissLoginError,
    };
  }

  if (form.hasSignedIn && form.isSyncFailed) {
    return {
      stage: "error",
      title: t("auth:login.feedback.syncFailedTitle"),
      message: t("auth:login.feedback.syncFailedMessage"),
      onRetry: form.retrySync,
      isRetrying: form.isRetryingSync,
      onDismiss: form.backToSignIn,
      autoDismissMs: 0,
      dismissLabel: t("common:actions.back"),
    };
  }

  if (form.isAppReady) {
    return {
      stage: "success",
      title: t("auth:login.feedback.successTitle"),
      message: t("auth:login.feedback.successMessage"),
      onContinue: form.continueToApp,
    };
  }

  if (form.isSyncingNow) {
    return {
      stage: "loading",
      title: t("auth:login.feedback.preparingTitle"),
      message: t("auth:login.feedback.preparingMessage"),
    };
  }

  return null;
}

type LoginFormProps = {
  logo?: ReactNode;
  contentStyle?: ComponentProps<typeof Animated.View>["style"];
  onFieldsLayout?: (height: number) => void;
  /** When set, login targets this clinic without flipping the store until success. */
  customerId?: string | null;
};

export function LoginForm({
  logo,
  contentStyle,
  onFieldsLayout,
  customerId,
}: LoginFormProps) {
  const { t } = useTranslation(["auth", "a11y", "common"]);
  const insets = useSafeAreaInsets();
  const footerOffset = useSplashFooterOffset();
  const native = useNativeColors();
  const login = useLoginForm(
    customerId !== undefined ? { customerId } : undefined,
  );
  const { formState } = login.form;
  const [focusedField, setFocusedField] = useState<
    "username" | "password" | null
  >(null);
  const fieldsEditable =
    !login.isSigningIn && !login.hasSignedIn && !login.isBiometricSigningIn;
  const canSubmit =
    Boolean(login.customerId) &&
    login.isOnline &&
    formState.isValid &&
    !login.isSigningIn &&
    !login.isBiometricSigningIn &&
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
              {t("auth:login.welcome")}
            </ThemedText>
            <ThemedText align="center" tone="muted">
              {t("auth:login.enterDetails")}
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
                {t("auth:login.pairBeforeSignIn")}
              </ThemedText>
              <Button
                label={t("auth:login.scanClinicQr")}
                onPress={login.goToQrScanner}
                tone="brand"
                variant="outline"
              />
            </ThemedView>
          ) : null}
          <LoginFieldShell focused={focusedField === "username"}>
            <PatientFormFieldRow align="center" icon={personIcon}>
              <ThemedText
                as="input"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect={false}
                className="w-full px-inline"
                editable={fieldsEditable}
                fieldVariant="bare"
                name="username"
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "username" ? null : current,
                  )
                }
                onFocus={() => setFocusedField("username")}
                placeholder={t("auth:login.usernamePlaceholder")}
                rules={{ required: true }}
                textContentType="username"
              />
            </PatientFormFieldRow>
          </LoginFieldShell>
          <LoginFieldShell focused={focusedField === "password"}>
            <PatientFormFieldRow align="center" icon={lockIcon}>
              <ThemedText
                as="input"
                autoComplete="password"
                className="w-full px-inline"
                editable={fieldsEditable}
                fieldVariant="bare"
                name="password"
                onBlur={() =>
                  setFocusedField((current) =>
                    current === "password" ? null : current,
                  )
                }
                onFocus={() => setFocusedField("password")}
                placeholder={t("auth:login.passwordPlaceholder")}
                rules={{ required: true }}
                secureTextEntry={!login.isPasswordVisible}
                textContentType="password"
                trailing={
                  <Button
                    accessibilityLabel={
                      login.isPasswordVisible
                        ? t("a11y:hidePassword")
                        : t("a11y:showPassword")
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
            </PatientFormFieldRow>
          </LoginFieldShell>
        </ThemedView>
      </Animated.View>
      <Animated.View
        className="flex-1 px-inline-comfortable"
        style={[{ paddingBottom: footerOffset }, contentStyle]}
      >
        {!login.hasSignedIn ? (
          <ThemedView space="compact" variant="stack">
            {!login.isOnline ? (
              <ThemedText align="center" tone="muted">
                {t("auth:login.offlineHint")}
              </ThemedText>
            ) : null}
            <Button
              disabled={!canSubmit}
              label={
                login.isSigningIn
                  ? t("auth:login.signingInButton")
                  : t("auth:login.button")
              }
              onPress={login.submit}
              size="lg"
            />
            {login.customerId ? (
              <>
                <View
                  accessibilityRole="none"
                  className="flex-row items-center"
                  style={{ gap: semantic.space.gap.default }}
                >
                  <View
                    className="flex-1"
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: native.border.subtle,
                    }}
                  />
                  <ThemedText tone="muted" variant="label">
                    {t("auth:login.or")}
                  </ThemedText>
                  <View
                    className="flex-1"
                    style={{
                      height: StyleSheet.hairlineWidth,
                      backgroundColor: native.border.subtle,
                    }}
                  />
                </View>
                <Button
                  accessibilityLabel={t("a11y:biometricLogin")}
                  disabled={
                    !login.canUseBiometricLogin ||
                    login.isBiometricSigningIn ||
                    login.isSigningIn ||
                    !login.isOnline
                  }
                  icon={<ThemedIcon name={fingerprintIcon} tone="brand" />}
                  label={
                    login.isBiometricSigningIn
                      ? t("auth:login.biometricSigningIn")
                      : t("auth:login.biometricButton")
                  }
                  onPress={login.signInWithBiometrics}
                  size="lg"
                  tone="brand"
                  variant="outline"
                />
              </>
            ) : null}
          </ThemedView>
        ) : null}
      </Animated.View>
      {(() => {
        const overlay = getLoginFeedbackOverlay(login, t);

        if (!overlay) {
          return null;
        }

        return <FeedbackOverlay {...overlay} />;
      })()}
      </View>
    </FormProvider>
  );
}
