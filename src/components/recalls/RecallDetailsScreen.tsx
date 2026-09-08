import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import type { PatientOverviewField } from "@/components/patients/patientDetails/PatientOverviewTab";
import { PatientOverviewTab } from "@/components/patients/patientDetails/PatientOverviewTab";
import { RecallDetailsActionBar } from "@/components/recalls/RecallDetailsActionBar";
import { RecallDetailsHero } from "@/components/recalls/RecallDetailsHero";
import { EmptyState, ThemedView } from "@/components/ui";
import { clockIcon } from "@/constants";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/auth/motion";
import { displayOrEmpty, formatDisplayDate } from "@/helpers/ui/display";
import { openPatientWhatsApp } from "@/helpers/patients/patientContact";
import { formatPatientPhone } from "@/helpers/patients/patientDisplay";
import { recallStatusLabel } from "@/helpers/recalls/recallDisplay";
import { hasRecallAppointment } from "@/helpers/recalls/recallKpis";
import type { PatientDetailsData } from "@/hooks/patients/usePatientDetails";
import {
  toAppointmentPatientDraft,
  useRecallDetails,
  type RecallDetailsData,
} from "@/hooks/recalls/useRecallDetails";
import { useAddAppointmentStore } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

export type RecallDetailsScreenProps = {
  recallId: string | undefined;
};

function formatIntervalDays(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (value === 1) {
    return "1 day";
  }

  return `${value} days`;
}

function buildRecallInformationFields(
  recall: RecallDetailsData,
): PatientOverviewField[] {
  const serviceCode = displayOrEmpty(recall.serviceCode, "No code");

  return [
    { label: "Service", value: recall.serviceName },
    { label: "Service code", ...serviceCode },
    { label: "Status", value: recallStatusLabel(recall) },
  ];
}

function buildRecallNote(recall: RecallDetailsData) {
  const note = displayOrEmpty(recall.note, "No note");
  return {
    value: note.value,
    empty: note.empty,
  };
}

function buildRecallTimelineFields(
  recall: RecallDetailsData,
): PatientOverviewField[] {
  const dueDate = formatDisplayDate(recall.dueDate);
  const recallDate = formatDisplayDate(recall.date);
  const appointmentDate = formatDisplayDate(recall.appointmentStartTime);
  const appointmentStatus = displayOrEmpty(
    recall.appointmentStatus,
    "No appointment",
  );

  return [
    { label: "Due date", ...dueDate },
    { label: "Recall date", ...recallDate },
    {
      label: "Interval",
      value: formatIntervalDays(recall.interval),
    },
    {
      label: "Reminder",
      value: formatIntervalDays(recall.reminderInterval),
    },
    {
      label: "Appointment",
      value: hasRecallAppointment(recall.appointmentId)
        ? appointmentDate.value
        : "Not linked",
      empty: !hasRecallAppointment(recall.appointmentId) || appointmentDate.empty,
    },
    {
      label: "Appt status",
      ...appointmentStatus,
      empty:
        !hasRecallAppointment(recall.appointmentId) || appointmentStatus.empty,
    },
  ];
}

function buildPatientContactFields(
  patient: PatientDetailsData,
): PatientOverviewField[] {
  const phone = displayOrEmpty(
    formatPatientPhone(patient.countryCode, patient.phoneNumber),
    "No phone",
  );
  const email = displayOrEmpty(patient.emailAddress, "No email");
  const address = displayOrEmpty(patient.address, "No address");

  return [
    { label: "Phone", ...phone },
    { label: "Email", ...email },
    { label: "Address", ...address },
    {
      label: "VIP status",
      value: patient.isVip ? "VIP" : "Normal",
    },
  ];
}

export function RecallDetailsScreen({ recallId }: RecallDetailsScreenProps) {
  const native = useNativeColors();
  const router = useRouter();
  const slideDuration = getAuthSlideDuration();
  const openWithPatient = useAddAppointmentStore(
    (state) => state.openWithPatient,
  );
  const { recall, patient, isLoading, error } = useRecallDetails(recallId);

  const recallInformation = useMemo(
    () => (recall ? buildRecallInformationFields(recall) : []),
    [recall],
  );

  const recallNote = useMemo(
    () => (recall ? buildRecallNote(recall) : null),
    [recall],
  );

  const recallTimeline = useMemo(
    () => (recall ? buildRecallTimelineFields(recall) : []),
    [recall],
  );

  const patientContact = useMemo(
    () => (patient ? buildPatientContactFields(patient) : []),
    [patient],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/recalls" as Href);
  }, [router]);

  const handleViewPatient = useCallback(() => {
    if (!patient?.id) {
      return;
    }

    router.push(`/patients/${patient.id}` as Href);
  }, [patient, router]);

  const handleAppointment = useCallback(() => {
    if (!recall || !patient) {
      return;
    }

    if (hasRecallAppointment(recall.appointmentId)) {
      router.push(`/appointments/${recall.appointmentId}` as Href);
      return;
    }

    openWithPatient(toAppointmentPatientDraft(patient));
  }, [openWithPatient, patient, recall, router]);

  const handleMessage = useCallback(() => {
    if (!patient) {
      return;
    }

    void openPatientWhatsApp(patient.countryCode, patient.phoneNumber);
  }, [patient]);

  if (isLoading) {
    return (
      <ThemedView
        contentClassName="items-center justify-center"
        inset="none"
        padBottom={false}
        scroll={false}
        variant="screen"
      >
        <ActivityIndicator color={native.brand.default} />
      </ThemedView>
    );
  }

  if (error || !recall || !recall.isActive || !patient) {
    return (
      <ThemedView
        contentClassName="items-center justify-center"
        inset="none"
        padBottom={false}
        scroll={false}
        variant="screen"
      >
        <EmptyState
          action={{ label: "Back to recalls", onPress: goBack }}
          description={
            error
              ? "Unable to load this recall."
              : "This recall could not be found."
          }
          icon={clockIcon}
          title="No recall"
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView
      edges={["bottom", "left", "right"]}
      inset="none"
      padBottom={false}
      scroll={false}
      variant="screen"
    >
      <RecallDetailsHero
        hasAppointment={hasRecallAppointment(recall.appointmentId)}
        onAppointment={handleAppointment}
        onMessage={handleMessage}
        onViewPatient={handleViewPatient}
        patient={patient}
      />

      <View
        className="min-h-0 flex-1 pt-stack"
        style={{
          paddingBottom: semantic.space.stack.compact,
        }}
      >
        <Animated.View
          className="min-h-0 flex-1"
          entering={FadeIn.duration(slideDuration).easing(AUTH_SLIDE_EASING)}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              gap: semantic.space.section,
              paddingBottom: semantic.space.page,
            }}
            showsVerticalScrollIndicator={false}
          >
            <PatientOverviewTab
              information={recallInformation}
              informationTitle="Recall Information"
              note={recallNote}
              timeline={recallTimeline}
              timelineTitle="Recall Timeline"
            />
            <PatientOverviewTab
              information={patientContact}
              informationTitle="Patient Information"
              timeline={[]}
            />
          </ScrollView>
        </Animated.View>
      </View>

      <RecallDetailsActionBar onBack={goBack} />
    </ThemedView>
  );
}
