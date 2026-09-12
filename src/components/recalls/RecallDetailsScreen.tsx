import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

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
import { t as translate } from "@/i18n";
import { useAddAppointmentStore, useResolvedLocale } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

export type RecallDetailsScreenProps = {
  recallId: string | undefined;
};

function formatIntervalDays(value: number): string {
  if (!Number.isFinite(value)) {
    return translate("common:empty.emDash");
  }

  if (value === 1) {
    return translate("common:days.oneDay");
  }

  return translate("common:days.nDays", { count: value });
}

function buildRecallInformationFields(
  recall: RecallDetailsData,
): PatientOverviewField[] {
  const serviceCode = displayOrEmpty(
    recall.serviceCode,
    translate("recalls:details.noCode"),
  );

  return [
    { label: translate("recalls:details.service"), value: recall.serviceName },
    { label: translate("recalls:details.serviceCode"), ...serviceCode },
    {
      label: translate("recalls:details.status"),
      value: recallStatusLabel(recall),
    },
  ];
}

function buildRecallNote(recall: RecallDetailsData) {
  const note = displayOrEmpty(recall.note, translate("common:empty.noNote"));
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
    translate("recalls:details.noAppointment"),
  );

  return [
    { label: translate("recalls:details.dueDate"), ...dueDate },
    { label: translate("recalls:details.recallDate"), ...recallDate },
    {
      label: translate("recalls:details.interval"),
      value: formatIntervalDays(recall.interval),
    },
    {
      label: translate("recalls:details.reminder"),
      value: formatIntervalDays(recall.reminderInterval),
    },
    {
      label: translate("recalls:details.appointment"),
      value: hasRecallAppointment(recall.appointmentId)
        ? appointmentDate.value
        : translate("recalls:details.notLinked"),
      empty:
        !hasRecallAppointment(recall.appointmentId) || appointmentDate.empty,
    },
    {
      label: translate("recalls:details.apptStatus"),
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
    translate("common:empty.noPhone"),
  );
  const email = displayOrEmpty(
    patient.emailAddress,
    translate("common:empty.noEmail"),
  );
  const address = displayOrEmpty(
    patient.address,
    translate("common:empty.noAddress"),
  );

  return [
    { label: translate("patients:details.phone"), ...phone },
    { label: translate("patients:details.email"), ...email },
    { label: translate("patients:details.address"), ...address },
    {
      label: translate("common:vip.status"),
      value: patient.isVip
        ? translate("common:vip.vip")
        : translate("common:vip.normal"),
    },
  ];
}

export function RecallDetailsScreen({ recallId }: RecallDetailsScreenProps) {
  const { t } = useTranslation(["recalls", "patients", "common"]);
  const native = useNativeColors();
  const router = useRouter();
  const slideDuration = getAuthSlideDuration();
  const openWithPatient = useAddAppointmentStore(
    (state) => state.openWithPatient,
  );
  const { recall, patient, isLoading, error } = useRecallDetails(recallId);
  const locale = useResolvedLocale();

  const recallInformation = useMemo(
    () => (recall ? buildRecallInformationFields(recall) : []),
    [locale, recall],
  );

  const recallNote = useMemo(
    () => (recall ? buildRecallNote(recall) : null),
    [locale, recall],
  );

  const recallTimeline = useMemo(
    () => (recall ? buildRecallTimelineFields(recall) : []),
    [locale, recall],
  );

  const patientContact = useMemo(
    () => (patient ? buildPatientContactFields(patient) : []),
    [locale, patient],
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
          action={{ label: t("recalls:details.backToRecalls"), onPress: goBack }}
          description={
            error
              ? t("recalls:details.loadError")
              : t("recalls:details.notFound")
          }
          icon={clockIcon}
          title={t("recalls:details.emptyTitle")}
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
              informationTitle={t("recalls:details.information")}
              note={recallNote}
              timeline={recallTimeline}
              timelineTitle={t("recalls:details.timeline")}
            />
            <PatientOverviewTab
              information={patientContact}
              informationTitle={t("recalls:details.patientInformation")}
              timeline={[]}
            />
          </ScrollView>
        </Animated.View>
      </View>

      <RecallDetailsActionBar onBack={goBack} />
    </ThemedView>
  );
}
