import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  appearanceIcon,
  calendarIcon,
  clockIcon,
  languageIcon,
  weekStartIcon,
} from "@/constants";
import type { WeekdayIndex } from "@/helpers/schedule/calendar";
import {
  applyScheduleViewPreference,
  setScheduleViewMode,
  useLocalePreferencesStore,
  useSchedulePreferencesStore,
  useThemePreferencesStore,
  type DefaultCalendarView,
  type HourFormat,
  type LocaleMode,
  type ThemeMode,
} from "@/stores";

import { SettingsSection } from "./SettingsSection";
import { SettingsSelectRow } from "./SettingsSelectRow";

type PreferenceSelectKey =
  | "language"
  | "appearance"
  | "defaultView"
  | "hourFormat"
  | "weekStartsOn";

export function SettingsPreferencesSection() {
  const { t } = useTranslation(["settings", "navigation"]);
  const mode = useThemePreferencesStore((state) => state.mode);
  const setMode = useThemePreferencesStore((state) => state.setMode);
  const localeMode = useLocalePreferencesStore((state) => state.mode);
  const setLocaleMode = useLocalePreferencesStore((state) => state.setMode);
  const defaultCalendarView = useSchedulePreferencesStore(
    (state) => state.defaultCalendarView,
  );
  const hourFormat = useSchedulePreferencesStore((state) => state.hourFormat);
  const weekStartsOn = useSchedulePreferencesStore(
    (state) => state.weekStartsOn,
  );
  const setDefaultCalendarView = useSchedulePreferencesStore(
    (state) => state.setDefaultCalendarView,
  );
  const setHourFormat = useSchedulePreferencesStore(
    (state) => state.setHourFormat,
  );
  const setWeekStartsOn = useSchedulePreferencesStore(
    (state) => state.setWeekStartsOn,
  );
  const [expandedSelect, setExpandedSelect] =
    useState<PreferenceSelectKey | null>(null);
  const [snapAppearanceClosed, setSnapAppearanceClosed] = useState(false);

  const appearanceOptions = useMemo(
    () => [
      {
        value: "system" as const,
        label: t("settings:preferences.appearance.system"),
      },
      {
        value: "light" as const,
        label: t("settings:preferences.appearance.light"),
      },
      {
        value: "dark" as const,
        label: t("settings:preferences.appearance.dark"),
      },
    ],
    [t],
  );

  const languageOptions = useMemo(
    () => [
      {
        value: "system" as const,
        label: t("settings:preferences.language.system"),
      },
      { value: "en" as const, label: t("settings:preferences.language.en") },
      { value: "fr" as const, label: t("settings:preferences.language.fr") },
      { value: "ar" as const, label: t("settings:preferences.language.ar") },
    ],
    [t],
  );

  const defaultViewOptions = useMemo(
    () => [
      {
        value: "last" as const,
        label: t("settings:preferences.defaultView.lastUsed"),
      },
      {
        value: "day" as const,
        label: t("navigation:schedule.view.day"),
      },
      {
        value: "week" as const,
        label: t("navigation:schedule.view.week"),
      },
      {
        value: "month" as const,
        label: t("navigation:schedule.view.month"),
      },
    ],
    [t],
  );

  const hourFormatOptions = useMemo(
    () => [
      {
        value: "12h" as const,
        label: t("settings:preferences.hourFormat.12h"),
      },
      {
        value: "24h" as const,
        label: t("settings:preferences.hourFormat.24h"),
      },
    ],
    [t],
  );

  const weekStartOptions = useMemo(
    () => [
      {
        value: 0 as WeekdayIndex,
        label: t("settings:preferences.weekStartsOn.sunday"),
      },
      {
        value: 1 as WeekdayIndex,
        label: t("settings:preferences.weekStartsOn.monday"),
      },
    ],
    [t],
  );

  function toggleSelect(key: PreferenceSelectKey) {
    if (key === "appearance") {
      setSnapAppearanceClosed(false);
    }
    setExpandedSelect((current) => (current === key ? null : key));
  }

  function handleAppearanceChange(next: ThemeMode) {
    setSnapAppearanceClosed(true);
    setMode(next);
  }

  function handleDefaultCalendarViewChange(next: DefaultCalendarView) {
    setDefaultCalendarView(next);
    if (next === "last") {
      applyScheduleViewPreference();
      return;
    }
    setScheduleViewMode(next);
  }

  return (
    <SettingsSection label={t("settings:preferences.section")}>
      <SettingsSelectRow<LocaleMode>
        title={t("settings:preferences.language.label")}
        icon={languageIcon}
        options={languageOptions}
        value={localeMode}
        onChange={setLocaleMode}
        expanded={expandedSelect === "language"}
        onToggle={() => toggleSelect("language")}
      />
      <SettingsSelectRow<ThemeMode>
        title={t("settings:preferences.appearance.label")}
        icon={appearanceIcon}
        options={appearanceOptions}
        value={mode}
        onChange={handleAppearanceChange}
        expanded={expandedSelect === "appearance"}
        instantCollapse={snapAppearanceClosed}
        onToggle={() => toggleSelect("appearance")}
      />
      <SettingsSelectRow<DefaultCalendarView>
        title={t("settings:preferences.defaultView.label")}
        icon={calendarIcon}
        options={defaultViewOptions}
        value={defaultCalendarView}
        onChange={handleDefaultCalendarViewChange}
        expanded={expandedSelect === "defaultView"}
        onToggle={() => toggleSelect("defaultView")}
      />
      <SettingsSelectRow<HourFormat>
        title={t("settings:preferences.hourFormat.label")}
        icon={clockIcon}
        options={hourFormatOptions}
        value={hourFormat}
        onChange={setHourFormat}
        expanded={expandedSelect === "hourFormat"}
        onToggle={() => toggleSelect("hourFormat")}
      />
      <SettingsSelectRow<WeekdayIndex>
        title={t("settings:preferences.weekStartsOn.label")}
        icon={weekStartIcon}
        last
        options={weekStartOptions}
        value={weekStartsOn === 0 ? 0 : 1}
        onChange={setWeekStartsOn}
        expanded={expandedSelect === "weekStartsOn"}
        onToggle={() => toggleSelect("weekStartsOn")}
      />
    </SettingsSection>
  );
}
