import { useCallback } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DetailsHeroAvatar,
  DetailsHeroCta,
  ThemedIcon,
  ThemedText,
} from "@/components/ui";
import { addAppointmentIcon, messageIcon, phoneIcon, starIcon } from "@/constants";
import {
  formatPatientName,
  type PatientCardData,
} from "@/helpers/patients/patientDisplay";
import {
  openPatientPhoneCall,
  openPatientWhatsApp,
  patientPhoneDigits,
} from "@/helpers/patients/patientContact";
import type { PatientDetailsData } from "@/hooks/patients/usePatientDetails";
import { useAddAppointmentStore } from "@/stores";
import { semantic } from "@/tokens";

type PatientDetailsHeroProps = {
  patient: PatientDetailsData;
};

function toAppointmentPatientDraft(
  patient: PatientDetailsData,
  displayName: string,
): PatientCardData {
  return {
    id: patient.id,
    displayName,
    countryCode: patient.countryCode?.trim() || null,
    phoneNumber: patient.phoneNumber?.trim() || null,
    isVip: patient.isVip,
    balance: patient.balance,
    currency: patient.currency,
    profilePhoto: patient.profilePhoto,
    fileDate: patient.fileDate,
    nextVisit: null,
  };
}

export function PatientDetailsHero({ patient }: PatientDetailsHeroProps) {
  const insets = useSafeAreaInsets();
  const openWithPatient = useAddAppointmentStore(
    (state) => state.openWithPatient,
  );
  const displayName = formatPatientName(patient) || "Unnamed patient";
  const hasPhone = Boolean(
    patientPhoneDigits(patient.countryCode, patient.phoneNumber),
  );

  const handleMessage = useCallback(() => {
    void openPatientWhatsApp(patient.countryCode, patient.phoneNumber);
  }, [patient.countryCode, patient.phoneNumber]);

  const handleCall = useCallback(() => {
    void openPatientPhoneCall(patient.countryCode, patient.phoneNumber);
  }, [patient.countryCode, patient.phoneNumber]);

  const handleAddAppointment = useCallback(() => {
    openWithPatient(toAppointmentPatientDraft(patient, displayName));
  }, [displayName, openWithPatient, patient]);

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
          accessibilityLabel="Message patient"
          disabled={!hasPhone}
          icon={messageIcon}
          label="Message"
          onPress={handleMessage}
        />
        <DetailsHeroCta
          accessibilityLabel="Call patient"
          disabled={!hasPhone}
          icon={phoneIcon}
          label="Call"
          onPress={handleCall}
        />
        <DetailsHeroCta
          accessibilityLabel="Add appointment"
          icon={addAppointmentIcon}
          label="Appointment"
          onPress={handleAddAppointment}
        />
      </View>
    </View>
  );
}
