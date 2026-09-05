import dayjs from "dayjs";
import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "@/components/app/FeedbackOverlay";
import {
  Button,
  DeleteConfirmationDialog,
  ThemedText,
  ThemedView,
} from "@/components/ui";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/authMotion";
import { deletePatientAndRelated } from "@/helpers/deletePatient";
import {
  formatNextVisitLabel,
  formatPatientBalance,
  formatPatientName,
  formatPatientPhone,
} from "@/helpers/patientDisplay";
import { requestSync } from "@/helpers/requestSync";
import {
  findNextPatientVisit,
  usePatientAppointments,
} from "@/hooks/usePatientAppointments";
import {
  usePatientDetails,
  type PatientDetailsData,
} from "@/hooks/usePatientDetails";
import { usePatientPayments } from "@/hooks/usePatientPayments";
import { usePatientServices } from "@/hooks/usePatientServices";
import { useAddPatientStore, useAuthUser } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import { PatientAppointmentsTab } from "./PatientAppointmentsTab";
import { PatientDetailsActionBar } from "./PatientDetailsActionBar";
import { PatientDetailsHero } from "./PatientDetailsHero";
import {
  PatientDetailsTabs,
  type PatientDetailsTab,
} from "./PatientDetailsTabs";
import {
  PatientOverviewTab,
  type PatientOverviewField,
} from "./PatientOverviewTab";
import { PatientPaymentsTab } from "./PatientPaymentsTab";
import { PatientServicesTab } from "./PatientServicesTab";

export type PatientDetailsScreenProps = {
  patientId: string | undefined;
};

function formatOverviewDate(value: Date | null | undefined): {
  value: string;
  empty: boolean;
} {
  if (!value || Number.isNaN(value.getTime())) {
    return { value: "Not set", empty: true };
  }

  return { value: dayjs(value).format("D MMM, YYYY"), empty: false };
}

function displayOrEmpty(
  value: string | null | undefined,
  emptyLabel: string,
): { value: string; empty: boolean } {
  const trimmed = value?.trim();
  if (!trimmed) {
    return { value: emptyLabel, empty: true };
  }

  return { value: trimmed, empty: false };
}

function buildInformationFields(
  patient: PatientDetailsData,
  currencySymbol: string | null | undefined,
): PatientOverviewField[] {
  const phone = displayOrEmpty(
    formatPatientPhone(patient.countryCode, patient.phoneNumber),
    "No phone",
  );
  const email = displayOrEmpty(patient.emailAddress, "No email");
  const address = displayOrEmpty(patient.address, "No address");
  const referral = displayOrEmpty(patient.referralSource, "No referral");
  const hasBalance = patient.balance != null && patient.balance !== 0;

  return [
    { label: "Phone", ...phone },
    { label: "Email", ...email },
    { label: "Address", ...address },
    {
      label: "Balance",
      value: hasBalance
        ? formatPatientBalance(
            patient.balance,
            patient.currency ?? currencySymbol ?? null,
          )
        : "No balance",
      empty: !hasBalance,
    },
    { label: "Referral source", ...referral },
    {
      label: "VIP status",
      value: patient.isVip ? "VIP" : "Normal",
    },
  ];
}

function buildTimelineFields(
  patient: PatientDetailsData,
  nextAppointment: Date | null,
): PatientOverviewField[] {
  const birthDate = formatOverviewDate(patient.birthDate);
  const fileDate = formatOverviewDate(patient.fileDate);
  const nextVisitLabel = nextAppointment
    ? formatNextVisitLabel(nextAppointment)
    : null;

  return [
    { label: "Birth date", ...birthDate },
    { label: "File date", ...fileDate },
    {
      label: "Next appointment",
      value: nextVisitLabel ?? "None scheduled",
      empty: !nextVisitLabel,
    },
    {
      label: "VIP status date",
      ...(patient.isVip
        ? formatOverviewDate(patient.vipStatusDate)
        : { value: "Not a VIP", empty: true }),
    },
  ];
}

export function PatientDetailsScreen({ patientId }: PatientDetailsScreenProps) {
  const native = useNativeColors();
  const router = useRouter();
  const user = useAuthUser();
  const slideDuration = getAuthSlideDuration();
  const openForEdit = useAddPatientStore((state) => state.openForEdit);
  const { patient, isLoading, error } = usePatientDetails(patientId);
  const { appointments, isLoading: appointmentsLoading } =
    usePatientAppointments(patientId);
  const { services, isLoading: servicesLoading } =
    usePatientServices(patientId);
  const { payments, isLoading: paymentsLoading } =
    usePatientPayments(patientId);
  const [activeTab, setActiveTab] = useState<PatientDetailsTab>("overview");
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] =
    useState<FeedbackOverlayProps | null>(null);

  const nextAppointment = useMemo(
    () => findNextPatientVisit(appointments),
    [appointments],
  );

  const informationFields = useMemo(
    () =>
      patient ? buildInformationFields(patient, user?.currencySymbol) : [],
    [patient, user?.currencySymbol],
  );

  const timelineFields = useMemo(
    () => (patient ? buildTimelineFields(patient, nextAppointment) : []),
    [nextAppointment, patient],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/patients" as Href);
  }, [router]);

  const dismissDeleteFeedback = useCallback(() => {
    setDeleteFeedback(null);
    setIsDeleting(false);
  }, []);

  const handleEdit = useCallback(() => {
    if (!patient) {
      return;
    }

    openForEdit(patient.id);
  }, [openForEdit, patient]);

  const handleDelete = useCallback(() => {
    if (!patient) {
      return;
    }

    setDeleteVisible(true);
  }, [patient]);

  const handleCancelDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setDeleteVisible(false);
  }, [isDeleting]);

  const handleConfirmDelete = useCallback(() => {
    if (!patient || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteVisible(false);
    setDeleteFeedback({
      stage: "loading",
      title: "Deleting...",
      message: "Removing this patient and related records.",
    });

    void (async () => {
      try {
        await deletePatientAndRelated(patient.id);
        requestSync();
        setDeleteFeedback({
          stage: "success",
          title: "Patient deleted",
          message: "The patient and related records were removed.",
          continueLabel: "Done",
          onContinue: () => {
            setDeleteFeedback(null);
            goBack();
          },
        });
      } catch (err) {
        setIsDeleting(false);
        setDeleteFeedback({
          stage: "error",
          title: "Unable to delete",
          message:
            err instanceof Error ? err.message : "Please try again.",
          retryLabel: "OK",
          onRetry: dismissDeleteFeedback,
          onDismiss: dismissDeleteFeedback,
        });
      }
    })();
  }, [dismissDeleteFeedback, goBack, isDeleting, patient]);

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case "overview":
        return (
          <PatientOverviewTab
            information={informationFields}
            timeline={timelineFields}
          />
        );
      case "appointments":
        return (
          <PatientAppointmentsTab
            appointments={appointments}
            isLoading={appointmentsLoading}
          />
        );
      case "services":
        return (
          <PatientServicesTab isLoading={servicesLoading} services={services} />
        );
      case "payments":
        return (
          <PatientPaymentsTab isLoading={paymentsLoading} payments={payments} />
        );
      default:
        return null;
    }
  }, [
    activeTab,
    appointments,
    appointmentsLoading,
    informationFields,
    payments,
    paymentsLoading,
    services,
    servicesLoading,
    timelineFields,
  ]);

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

  if (error || !patient || !patient.isActive) {
    return (
      <ThemedView
        contentClassName="items-center justify-center px-page"
        inset="none"
        padBottom={false}
        scroll={false}
        variant="screen"
      >
        <ThemedView align="center" space="default" variant="stack">
          <ThemedText align="center" tone="muted">
            {error
              ? "Unable to load this patient."
              : "This patient could not be found."}
          </ThemedText>
          <Button
            label="Back to patients"
            onPress={goBack}
            tone="neutral"
            variant="outline"
          />
        </ThemedView>
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
      <PatientDetailsHero patient={patient} />
      <PatientDetailsTabs activeTab={activeTab} onSelectTab={setActiveTab} />

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
          {tabContent}
        </Animated.View>
      </View>

      <PatientDetailsActionBar
        onBack={goBack}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <DeleteConfirmationDialog
        confirming={isDeleting}
        message={`Are you sure you want to delete ${formatPatientName(patient) || "this patient"}?`}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete patient"
        visible={deleteVisible}
      />

      {deleteFeedback ? (
        <Modal
          animationType="fade"
          statusBarTranslucent
          transparent
          visible
        >
          <View className="flex-1">
            <FeedbackOverlay {...deleteFeedback} />
          </View>
        </Modal>
      ) : null}
    </ThemedView>
  );
}
