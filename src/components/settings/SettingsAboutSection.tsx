import Constants from "expo-constants";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ui";
import { infoIcon } from "@/constants";

import { SettingsRow, SettingsSection } from "./SettingsSection";

export function SettingsAboutSection() {
  const { t } = useTranslation("settings");
  const appName =
    Constants.expoConfig?.name ??
    Constants.expoConfig?.slug ??
    "Dentrooper360";
  const version =
    Constants.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    "—";
  const build = Constants.nativeBuildVersion;

  return (
    <SettingsSection label={t("about.section")}>
      <SettingsRow
        icon={infoIcon}
        title={t("about.appName")}
        trailing={
          <ThemedText className="font-semibold" tone="muted" variant="label">
            {appName}
          </ThemedText>
        }
      />
      <SettingsRow
        icon={infoIcon}
        last={!build}
        title={t("about.version")}
        trailing={
          <ThemedText className="font-semibold" tone="muted" variant="label">
            {version}
          </ThemedText>
        }
      />
      {build ? (
        <SettingsRow
          icon={infoIcon}
          last
          title={t("about.build")}
          trailing={
            <ThemedText className="font-semibold" tone="muted" variant="label">
              {build}
            </ThemedText>
          }
        />
      ) : null}
    </SettingsSection>
  );
}
