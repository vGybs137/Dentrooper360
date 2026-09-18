import { useTranslation } from "react-i18next";
import { Switch } from "react-native";

import { privacyShieldIcon } from "@/constants";
import { usePrivacyPreferencesStore } from "@/stores";
import { useNativeColors } from "@/theme";

import { SettingsRow, SettingsSection } from "./SettingsSection";

export function SettingsPrivacySection() {
  const { t } = useTranslation(["settings", "a11y"]);
  const native = useNativeColors();
  const hideInAppSwitcher = usePrivacyPreferencesStore(
    (state) => state.hideInAppSwitcher,
  );
  const setHideInAppSwitcher = usePrivacyPreferencesStore(
    (state) => state.setHideInAppSwitcher,
  );

  return (
    <SettingsSection label={t("settings:privacy.section")}>
      <SettingsRow
        description={
          hideInAppSwitcher
            ? t("settings:privacy.hideInAppSwitcherOnDesc")
            : t("settings:privacy.hideInAppSwitcherOffDesc")
        }
        icon={privacyShieldIcon}
        last
        title={t("settings:privacy.hideInAppSwitcher")}
        trailing={
          <Switch
            accessibilityLabel={t("a11y:hideInAppSwitcher")}
            onValueChange={setHideInAppSwitcher}
            thumbColor={native.surface.raised}
            trackColor={{
              false: native.border.subtle,
              true: native.brand.default,
            }}
            value={hideInAppSwitcher}
          />
        }
      />
    </SettingsSection>
  );
}
