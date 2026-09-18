import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { phoneIcon } from "@/constants";
import { PATIENT_COUNTRY_CODE_OPTIONS } from "@/constants/patientForm";
import { usePatientPreferencesStore } from "@/stores";

import { SettingsSection } from "./SettingsSection";
import { SettingsSelectRow } from "./SettingsSelectRow";

export function SettingsPatientsSection() {
  const { t } = useTranslation("settings");
  const defaultCountryCode = usePatientPreferencesStore(
    (state) => state.defaultCountryCode,
  );
  const setDefaultCountryCode = usePatientPreferencesStore(
    (state) => state.setDefaultCountryCode,
  );
  const [expanded, setExpanded] = useState(false);

  const countryOptions = useMemo(
    () =>
      PATIENT_COUNTRY_CODE_OPTIONS.map((code) => ({
        value: code,
        label: code,
      })),
    [],
  );

  return (
    <SettingsSection label={t("patients.section")}>
      <SettingsSelectRow<string>
        description={t("patients.defaultCountryCode.desc")}
        expanded={expanded}
        icon={phoneIcon}
        last
        onChange={setDefaultCountryCode}
        onToggle={() => setExpanded((open) => !open)}
        options={countryOptions}
        title={t("patients.defaultCountryCode.label")}
        value={defaultCountryCode}
      />
    </SettingsSection>
  );
}
