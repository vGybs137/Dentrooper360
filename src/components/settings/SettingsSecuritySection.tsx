import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "react-native";

import { clockIcon, fingerprintIcon, lockIcon } from "@/constants";
import { authenticateDeviceOwner, canOfferBiometricLock } from "@/security";
import {
  APP_LOCK_TIMEOUT_15_MIN_MS,
  APP_LOCK_TIMEOUT_5_MIN_MS,
  APP_LOCK_TIMEOUT_IMMEDIATE_MS,
} from "@/security/biometric/shouldLockSession";
import { markAppUnlocked, useAppLockStore } from "@/stores";
import { useNativeColors } from "@/theme";

import { SettingsSection, SettingsRow } from "./SettingsSection";
import { SettingsSelectRow } from "./SettingsSelectRow";

export function SettingsSecuritySection() {
  const { t } = useTranslation(["settings", "auth", "a11y"]);
  const native = useNativeColors();
  const enabled = useAppLockStore((state) => state.enabled);
  const timeoutMs = useAppLockStore((state) => state.timeoutMs);
  const setEnabled = useAppLockStore((state) => state.setEnabled);
  const setTimeoutMs = useAppLockStore((state) => state.setTimeoutMs);
  const biometricLoginEnabled = useAppLockStore(
    (state) => state.biometricLoginEnabled,
  );
  const setBiometricLoginEnabled = useAppLockStore(
    (state) => state.setBiometricLoginEnabled,
  );
  const [available, setAvailable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isEnablingLogin, setIsEnablingLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void canOfferBiometricLock().then((canOffer) => {
      if (!cancelled) {
        setAvailable(canOffer);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const timeoutOptions = useMemo(
    () =>
      [
        {
          value: APP_LOCK_TIMEOUT_IMMEDIATE_MS,
          label: t("settings:security.immediately"),
        },
        {
          value: APP_LOCK_TIMEOUT_5_MIN_MS,
          label: t("settings:security.fiveMinutes"),
        },
        {
          value: APP_LOCK_TIMEOUT_15_MIN_MS,
          label: t("settings:security.fifteenMinutes"),
        },
      ] as const,
    [t],
  );

  const showBiometricLogin = available || biometricLoginEnabled;
  const showAppLock = available || enabled;

  if (!showBiometricLogin && !showAppLock) {
    return null;
  }

  async function onToggle(next: boolean) {
    if (!next) {
      setEnabled(false);
      return;
    }

    setIsEnabling(true);
    try {
      const unlocked = await authenticateDeviceOwner(t("auth:lock.prompt"));
      if (!unlocked) {
        return;
      }
      setEnabled(true);
      markAppUnlocked();
    } finally {
      setIsEnabling(false);
    }
  }

  async function onBiometricLoginToggle(next: boolean) {
    if (!next) {
      setBiometricLoginEnabled(false);
      return;
    }

    setIsEnablingLogin(true);
    try {
      const accepted = await authenticateDeviceOwner(
        t("auth:login.biometricEnablePrompt"),
      );
      if (accepted) {
        setBiometricLoginEnabled(true);
      }
    } finally {
      setIsEnablingLogin(false);
    }
  }

  return (
    <SettingsSection label={t("settings:security.section")}>
      {showBiometricLogin ? (
        <SettingsRow
          description={
            biometricLoginEnabled
              ? t("settings:security.biometricLoginOnDesc")
              : t("settings:security.biometricLoginOffDesc")
          }
          icon={fingerprintIcon}
          last={!showAppLock}
          title={t("settings:security.biometricLogin")}
          trailing={
            <Switch
              accessibilityLabel={t("a11y:biometricLogin")}
              disabled={isEnablingLogin}
              onValueChange={(next) => {
                void onBiometricLoginToggle(next);
              }}
              thumbColor={native.surface.raised}
              trackColor={{
                false: native.border.subtle,
                true: native.brand.default,
              }}
              value={biometricLoginEnabled}
            />
          }
        />
      ) : null}
      {showAppLock ? (
      <>
      <SettingsRow
        description={
          enabled
            ? t("settings:security.appLockOnDesc")
            : t("settings:security.appLockOffDesc")
        }
        icon={lockIcon}
        last={!enabled}
        title={t("settings:security.appLock")}
        trailing={
          <Switch
            accessibilityLabel={t("a11y:appLock")}
            disabled={isEnabling}
            onValueChange={(next) => {
              void onToggle(next);
            }}
            thumbColor={native.surface.raised}
            trackColor={{
              false: native.border.subtle,
              true: native.brand.default,
            }}
            value={enabled}
          />
        }
      />
      {enabled ? (
        <SettingsSelectRow
          description={t("settings:security.timeoutDesc")}
          expanded={expanded}
          icon={clockIcon}
          last
          onChange={(value) => {
            setTimeoutMs(value);
            setExpanded(false);
          }}
          onToggle={() => {
            setExpanded((open) => !open);
          }}
          options={timeoutOptions}
          title={t("settings:security.timeout")}
          value={timeoutMs}
        />
      ) : null}
      </>
      ) : null}
    </SettingsSection>
  );
}
