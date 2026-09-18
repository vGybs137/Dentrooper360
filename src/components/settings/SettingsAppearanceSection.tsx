import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { appearanceIcon, languageIcon } from "@/constants";
import {
  useLocalePreferencesStore,
  useThemePreferencesStore,
  type LocaleMode,
  type ThemeMode,
} from "@/stores";

import { SettingsSection } from "./SettingsSection";
import { SettingsSelectRow } from "./SettingsSelectRow";

type AppearanceSelectKey = "language" | "appearance";

export function SettingsAppearanceSection() {
  const { t } = useTranslation("settings");
  const mode = useThemePreferencesStore((state) => state.mode);
  const setMode = useThemePreferencesStore((state) => state.setMode);
  const localeMode = useLocalePreferencesStore((state) => state.mode);
  const setLocaleMode = useLocalePreferencesStore((state) => state.setMode);
  const [expandedSelect, setExpandedSelect] =
    useState<AppearanceSelectKey | null>(null);
  const [snapAppearanceClosed, setSnapAppearanceClosed] = useState(false);

  const appearanceOptions = useMemo(
    () => [
      {
        value: "system" as const,
        label: t("preferences.appearance.system"),
      },
      {
        value: "light" as const,
        label: t("preferences.appearance.light"),
      },
      {
        value: "dark" as const,
        label: t("preferences.appearance.dark"),
      },
    ],
    [t],
  );

  const languageOptions = useMemo(
    () => [
      {
        value: "system" as const,
        label: t("preferences.language.system"),
      },
      { value: "en" as const, label: t("preferences.language.en") },
      { value: "fr" as const, label: t("preferences.language.fr") },
      { value: "ar" as const, label: t("preferences.language.ar") },
    ],
    [t],
  );

  function toggleSelect(key: AppearanceSelectKey) {
    if (key === "appearance") {
      setSnapAppearanceClosed(false);
    }
    setExpandedSelect((current) => (current === key ? null : key));
  }

  function handleAppearanceChange(next: ThemeMode) {
    setSnapAppearanceClosed(true);
    setMode(next);
  }

  return (
    <SettingsSection label={t("appearance.section")}>
      <SettingsSelectRow<LocaleMode>
        description={t("preferences.languageDesc")}
        title={t("preferences.language.label")}
        icon={languageIcon}
        options={languageOptions}
        value={localeMode}
        onChange={setLocaleMode}
        expanded={expandedSelect === "language"}
        onToggle={() => toggleSelect("language")}
      />
      <SettingsSelectRow<ThemeMode>
        description={t("preferences.appearanceDesc")}
        title={t("preferences.appearance.label")}
        icon={appearanceIcon}
        last
        options={appearanceOptions}
        value={mode}
        onChange={handleAppearanceChange}
        expanded={expandedSelect === "appearance"}
        instantCollapse={snapAppearanceClosed}
        onToggle={() => toggleSelect("appearance")}
      />
    </SettingsSection>
  );
}
