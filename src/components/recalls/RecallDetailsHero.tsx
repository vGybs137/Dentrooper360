import { useCallback } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  DetailsHeroAvatar,
  DetailsHeroCta,
  ThemedIcon,
  ThemedText,
} from "@/components/ui";
import {
  addAppointmentIcon,
  calendarIcon,
  messageIcon,
  personIcon,
  starIcon,
} from "@/constants";
import { patientPhoneDigits } from "@/helpers/patients/patientContact";
import { formatPatientName } from "@/helpers/patients/patientDisplay";
import type { PatientDetailsData } from "@/hooks/patients/usePatientDetails";
import { semantic } from "@/tokens";

type RecallDetailsHeroProps = {
  patient: PatientDetailsData;
  hasAppointment: boolean;
  onViewPatient: () => void;
  onAppointment: () => void;
  onMessage: () => void;
};

export function RecallDetailsHero({
  patient,
  hasAppointment,
  onViewPatient,
  onAppointment,
  onMessage,
}: RecallDetailsHeroProps) {
  const { t } = useTranslation(["recalls", "patients", "a11y", "common"]);
  const insets = useSafeAreaInsets();
  const displayName =
    formatPatientName(patient) || t("common:patient.unnamed");
  const hasPhone = Boolean(
    patientPhoneDigits(patient.countryCode, patient.phoneNumber),
  );

  const handleMessage = useCallback(() => {
    onMessage();
  }, [onMessage]);

  return (
    <View
      className="w-full items-center gap-stack bg-surface-sunken"
      style={{
        borderBottomLeftRadius: semantic.radius.dialog,
        borderBottomRightRadius: semantic.radius.dialog,
        paddingTop: insets.top + semantic.space.section,
        paddingBottom: semantic.space.section,
        paddingHorizontal: semantic.space.inline.default,
      }}
    >
      <DetailsHeroAvatar
        displayName={displayName}
        profilePhoto={patient.profilePhoto}
      />

      <View className="w-full flex-row items-center justify-center gap-1.5 px-inline">
        <ThemedText
          align="center"
          className="min-w-0 flex-1 font-semibold"
          numberOfLines={2}
          variant="title"
        >
          {displayName}
        </ThemedText>
        {patient.isVip ? (
          <ThemedIcon dimension={18} name={starIcon} tone="brand" />
        ) : null}
      </View>

      <View className="w-full flex-row items-start justify-between gap-1 px-inline">
        <DetailsHeroCta
          accessibilityLabel={t("a11y:viewPatient")}
          icon={personIcon}
          label={t("recalls:hero.patient")}
          onPress={onViewPatient}
        />
        <DetailsHeroCta
          accessibilityLabel={
            hasAppointment
              ? t("a11y:viewAppointment")
              : t("a11y:addAppointment")
          }
          icon={hasAppointment ? calendarIcon : addAppointmentIcon}
          label={t("patients:details.cta.appointment")}
          onPress={onAppointment}
        />
        <DetailsHeroCta
          accessibilityLabel={t("a11y:messagePatient")}
          disabled={!hasPhone}
          icon={messageIcon}
          label={t("recalls:hero.message")}
          onPress={handleMessage}
        />
      </View>
    </View>
  );
}
