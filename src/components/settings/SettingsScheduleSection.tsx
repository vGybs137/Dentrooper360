import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  calendarIcon,
  clockIcon,
  locationIcon,
  weekStartIcon,
} from "@/constants";
import type { WeekdayIndex } from "@/helpers/schedule/calendar";
import { useAppointmentFormOptions } from "@/hooks/schedule/useAppointmentFormOptions";
import {
  applyScheduleViewPreference,
  DEFAULT_APPOINTMENT_DURATION_OPTIONS,
  setScheduleViewMode,
  useSchedulePreferencesStore,
  type DefaultAppointmentDurationMinutes,
  type DefaultCalendarView,
  type HourFormat,
} from "@/stores";

import { SettingsSection } from "./SettingsSection";
import { SettingsSelectRow } from "./SettingsSelectRow";

const AUTO_LOCATION_VALUE = "";

type ScheduleSelectKey =
  | "defaultView"
  | "hourFormat"
  | "weekStartsOn"
  | "defaultLocation"
  | "defaultDuration";

export function SettingsScheduleSection() {
  const { t } = useTranslation(["settings", "navigation"]);
  const defaultCalendarView = useSchedulePreferencesStore(
    (state) => state.defaultCalendarView,
  );
  const hourFormat = useSchedulePreferencesStore((state) => state.hourFormat);
  const weekStartsOn = useSchedulePreferencesStore(
    (state) => state.weekStartsOn,
  );
  const defaultLocationId = useSchedulePreferencesStore(
    (state) => state.defaultLocationId,
  );
  const defaultAppointmentDurationMinutes = useSchedulePreferencesStore(
    (state) => state.defaultAppointmentDurationMinutes,
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
  const setDefaultLocationId = useSchedulePreferencesStore(
    (state) => state.setDefaultLocationId,
  );
  const setDefaultAppointmentDurationMinutes = useSchedulePreferencesStore(
    (state) => state.setDefaultAppointmentDurationMinutes,
  );
  const { locations } = useAppointmentFormOptions({
    loadPatients: false,
    enabled: true,
  });
  const [expandedSelect, setExpandedSelect] =
    useState<ScheduleSelectKey | null>(null);

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

  const locationOptions = useMemo(
    () => [
      {
        value: AUTO_LOCATION_VALUE,
        label: t("settings:schedule.defaultLocation.auto"),
      },
      ...locations.map((location) => ({
        value: location.id,
        label: location.name,
      })),
    ],
    [locations, t],
  );

  const durationOptions = useMemo(
    () =>
      DEFAULT_APPOINTMENT_DURATION_OPTIONS.map((minutes) => ({
        value: minutes,
        label: t("settings:schedule.defaultDuration.minutes", {
          count: minutes,
        }),
      })),
    [t],
  );

  function toggleSelect(key: ScheduleSelectKey) {
    setExpandedSelect((current) => (current === key ? null : key));
  }

  function handleDefaultCalendarViewChange(next: DefaultCalendarView) {
    setDefaultCalendarView(next);
    if (next === "last") {
      applyScheduleViewPreference();
      return;
    }
    setScheduleViewMode(next);
  }

  function handleLocationChange(next: string) {
    setDefaultLocationId(next === AUTO_LOCATION_VALUE ? null : next);
  }

  const locationValue =
    defaultLocationId &&
    locations.some((location) => location.id === defaultLocationId)
      ? defaultLocationId
      : AUTO_LOCATION_VALUE;

  return (
    <SettingsSection label={t("settings:schedule.section")}>
      <SettingsSelectRow<DefaultCalendarView>
        description={t("settings:preferences.defaultViewDesc")}
        title={t("settings:preferences.defaultView.label")}
        icon={calendarIcon}
        options={defaultViewOptions}
        value={defaultCalendarView}
        onChange={handleDefaultCalendarViewChange}
        expanded={expandedSelect === "defaultView"}
        onToggle={() => toggleSelect("defaultView")}
      />
      <SettingsSelectRow<HourFormat>
        description={t("settings:preferences.hourFormatDesc")}
        title={t("settings:preferences.hourFormat.label")}
        icon={clockIcon}
        options={hourFormatOptions}
        value={hourFormat}
        onChange={setHourFormat}
        expanded={expandedSelect === "hourFormat"}
        onToggle={() => toggleSelect("hourFormat")}
      />
      <SettingsSelectRow<WeekdayIndex>
        description={t("settings:preferences.weekStartsOnDesc")}
        title={t("settings:preferences.weekStartsOn.label")}
        icon={weekStartIcon}
        options={weekStartOptions}
        value={weekStartsOn === 0 ? 0 : 1}
        onChange={setWeekStartsOn}
        expanded={expandedSelect === "weekStartsOn"}
        onToggle={() => toggleSelect("weekStartsOn")}
      />
      <SettingsSelectRow<string>
        description={t("settings:schedule.defaultLocation.desc")}
        title={t("settings:schedule.defaultLocation.label")}
        icon={locationIcon}
        options={locationOptions}
        value={locationValue}
        onChange={handleLocationChange}
        expanded={expandedSelect === "defaultLocation"}
        onToggle={() => toggleSelect("defaultLocation")}
      />
      <SettingsSelectRow<DefaultAppointmentDurationMinutes>
        description={t("settings:schedule.defaultDuration.desc")}
        title={t("settings:schedule.defaultDuration.label")}
        icon={clockIcon}
        last
        options={durationOptions}
        value={defaultAppointmentDurationMinutes}
        onChange={setDefaultAppointmentDurationMinutes}
        expanded={expandedSelect === "defaultDuration"}
        onToggle={() => toggleSelect("defaultDuration")}
      />
    </SettingsSection>
  );
}
