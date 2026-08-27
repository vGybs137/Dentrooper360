import { useState } from "react";

import {
  appearanceIcon,
  calendarIcon,
  clockIcon,
  weekStartIcon,
} from "@/constants";
import {
  applyScheduleViewPreference,
  setScheduleViewMode,
  useSchedulePreferencesStore,
  useThemePreferencesStore,
  type DefaultCalendarView,
  type HourFormat,
  type ThemeMode,
} from "@/stores";
import type { WeekdayIndex } from "@/utils/calendar";

import { SettingsSection } from "./SettingsSection";
import { SettingsSelectRow } from "./SettingsSelectRow";

type PreferenceSelectKey =
  | "appearance"
  | "defaultView"
  | "hourFormat"
  | "weekStartsOn";

const DEFAULT_VIEW_OPTIONS = [
  { value: "last" as const, label: "Last used" },
  { value: "day" as const, label: "Day" },
  { value: "week" as const, label: "Week" },
  { value: "month" as const, label: "Month" },
];

const HOUR_FORMAT_OPTIONS = [
  { value: "12h" as const, label: "12-hour" },
  { value: "24h" as const, label: "24-hour" },
];

const WEEK_START_OPTIONS = [
  { value: 0 as WeekdayIndex, label: "Sunday" },
  { value: 1 as WeekdayIndex, label: "Monday" },
];

const APPEARANCE_OPTIONS = [
  { value: "system" as const, label: "System" },
  { value: "light" as const, label: "Light" },
  { value: "dark" as const, label: "Dark" },
];

export function SettingsPreferencesSection() {
  const mode = useThemePreferencesStore((state) => state.mode);
  const setMode = useThemePreferencesStore((state) => state.setMode);
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
    <SettingsSection label="User preferences">
      <SettingsSelectRow<ThemeMode>
        title="Appearance"
        description="App color scheme"
        icon={appearanceIcon}
        options={APPEARANCE_OPTIONS}
        value={mode}
        onChange={handleAppearanceChange}
        expanded={expandedSelect === "appearance"}
        instantCollapse={snapAppearanceClosed}
        onToggle={() => toggleSelect("appearance")}
      />
      <SettingsSelectRow<DefaultCalendarView>
        title="Default calendar view"
        description="Opens when you launch Schedule"
        icon={calendarIcon}
        options={DEFAULT_VIEW_OPTIONS}
        value={defaultCalendarView}
        onChange={handleDefaultCalendarViewChange}
        expanded={expandedSelect === "defaultView"}
        onToggle={() => toggleSelect("defaultView")}
      />
      <SettingsSelectRow<HourFormat>
        title="Hour format"
        description="Calendar and appointment times"
        icon={clockIcon}
        options={HOUR_FORMAT_OPTIONS}
        value={hourFormat}
        onChange={setHourFormat}
        expanded={expandedSelect === "hourFormat"}
        onToggle={() => toggleSelect("hourFormat")}
      />
      <SettingsSelectRow<WeekdayIndex>
        title="Week starts on"
        description="Month and week calendars"
        icon={weekStartIcon}
        last
        options={WEEK_START_OPTIONS}
        value={weekStartsOn === 0 ? 0 : 1}
        onChange={setWeekStartsOn}
        expanded={expandedSelect === "weekStartsOn"}
        onToggle={() => toggleSelect("weekStartsOn")}
      />
    </SettingsSection>
  );
}
