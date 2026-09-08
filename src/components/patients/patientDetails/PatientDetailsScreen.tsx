import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "@/components/app/FeedbackOverlay";
import {
  DeleteConfirmationDialog,
  EmptyState,
  ThemedView,
} from "@/components/ui";
import { personIcon } from "@/constants";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/auth/motion";
import { deletePatientAndRelated } from "@/helpers/patients/deletePatient";
import { displayOrEmpty, formatDisplayDate } from "@/helpers/ui/display";
import {
  formatNextVisitLabel,
  formatPatientBalance,
  formatPatientName,
  formatPatientPhone,
  type PatientCardData,
} from "@/helpers/patients/patientDisplay";
import { requestSync } from "@/helpers/sync/requestSync";
import {
  findNextPatientVisit,
  usePatientAppointments,
} from "@/hooks/patients/usePatientAppointments";
import {
  usePatientDetails,
  type PatientDetailsData,
} from "@/hooks/patients/usePatientDetails";
import { usePatientPayments } from "@/hooks/patients/usePatientPayments";
import { usePatientServices } from "@/hooks/patients/usePatientServices";
import {
  useAddAppointmentStore,
  useAddPatientStore,
  useAuthUser,
} from "@/stores";
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
  const birthDate = formatDisplayDate(patient.birthDate);
  const fileDate = formatDisplayDate(patient.fileDate);
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
  ];
}

export function PatientDetailsScreen({ patientId }: PatientDetailsScreenProps) {
  const native = useNativeColors();
  const router = useRouter();
  const user = useAuthUser();
  const slideDuration = getAuthSlideDuration();
  const openForEdit = useAddPatientStore((state) => state.openForEdit);
  const openWithPatient = useAddAppointmentStore(
    (state) => state.openWithPatient,
  );
  const { patient, isLoading, error } = usePatientDetails(patientId);
  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
  } = usePatientAppointments(patientId);
  const {
    services,
    isLoading: servicesLoading,
    error: servicesError,
  } = usePatientServices(patientId);
  const {
    payments,
    isLoading: paymentsLoading,
    error: paymentsError,
  } = usePatientPayments(patientId);
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

  const handleAddAppointment = useCallback(() => {
    if (!patient) {
      return;
    }

    const displayName = formatPatientName(patient) || "Unnamed patient";
    const draft: PatientCardData = {
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
    openWithPatient(draft);
  }, [openWithPatient, patient]);

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
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: semantic.space.page,
            }}
            showsVerticalScrollIndicator={false}
          >
            <PatientOverviewTab
              information={informationFields}
              timeline={timelineFields}
            />
          </ScrollView>
        );
      case "appointments":
        return (
          <PatientAppointmentsTab
            appointments={appointments}
            error={appointmentsError}
            isLoading={appointmentsLoading}
            onAddAppointment={handleAddAppointment}
          />
        );
      case "services":
        return (
          <PatientServicesTab
            error={servicesError}
            isLoading={servicesLoading}
            services={services}
          />
        );
      case "payments":
        return (
          <PatientPaymentsTab
            error={paymentsError}
            isLoading={paymentsLoading}
            payments={payments}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab,
    appointments,
    appointmentsError,
    appointmentsLoading,
    handleAddAppointment,
    informationFields,
    payments,
    paymentsError,
    paymentsLoading,
    services,
    servicesError,
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
        contentClassName="items-center justify-center"
        inset="none"
        padBottom={false}
        scroll={false}
        variant="screen"
      >
        <EmptyState
          action={{ label: "Back to patients", onPress: goBack }}
          description={
            error
              ? "Unable to load this patient."
              : "This patient could not be found."
          }
          icon={personIcon}
          title="No patient"
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
