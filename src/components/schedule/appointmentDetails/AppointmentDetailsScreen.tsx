import { useDatabase } from "@nozbe/watermelondb/react";
import dayjs from "dayjs";
import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "@/components/app/FeedbackOverlay";
import {
  Button,
  DeleteConfirmationDialog,
  DetailsActionBar,
  DETAILS_ACTION_BAR_HEIGHT,
  DetailsSection,
  EmptyState,
  ThemedIcon,
  ThemedText,
  ThemedView,
  type DetailsField,
} from "@/components/ui";
import {
  calendarIcon,
  deleteIcon,
  editIcon,
} from "@/constants";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/auth/motion";
import { navBackChevronIcon, navForwardChevronIcon } from "@/helpers/i18n/navBackChevron";
import { pickLocalizedName } from "@/helpers/i18n/pickLocalizedName";
import {
  formatPatientName,
  mapPatientToCardData,
} from "@/helpers/patients/patientDisplay";
import {
  initialsFromPatientName,
  patientInitialsColorsFromName,
} from "@/helpers/patients/patientInitials";
import { requestSync } from "@/helpers/sync/requestSync";
import { dayjsTimePattern } from "@/helpers/ui/timeFormat";
import { useAppointmentDetails } from "@/hooks/schedule/useAppointmentDetails";
import { useAddAppointmentStore, useResolvedLocale } from "@/stores";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { useNativeColors, useResolvedTheme } from "@/theme";
import { semantic } from "@/tokens";

const AVATAR_SIZE = 80;

function PatientAvatar({
  displayName,
  profilePhoto,
}: {
  displayName: string;
  profilePhoto: string | null;
}) {
  const resolvedTheme = useResolvedTheme();
  const initials = useMemo(
    () => initialsFromPatientName(displayName),
    [displayName],
  );
  const initialsColors = useMemo(
    () =>
      patientInitialsColorsFromName(displayName, {
        isDark: resolvedTheme === "dark",
      }),
    [displayName, resolvedTheme],
  );

  if (profilePhoto) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: profilePhoto }}
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
        }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        backgroundColor: initialsColors.background,
      }}
    >
      <Text
        className="text-xl font-semibold"
        style={{ color: initialsColors.foreground }}
      >
        {initials}
      </Text>
    </View>
  );
}

function PatientHero({
  displayName,
  hasPatient,
  profilePhoto,
  onPress,
}: {
  displayName: string;
  hasPatient: boolean;
  profilePhoto: string | null;
  onPress?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const chevronSize = 35;

  const content = (
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
      {hasPatient ? (
        <PatientAvatar displayName={displayName} profilePhoto={profilePhoto} />
      ) : null}

      <View className="w-full flex-row items-center">
        {onPress ? <View style={{ width: chevronSize }} /> : null}

        <ThemedText
          align="center"
          className="min-w-0 flex-1 font-semibold"
          numberOfLines={2}
          variant="title"
        >
          {displayName}
        </ThemedText>

        {onPress ? (
          <ThemedIcon
            dimension={chevronSize}
            name={navForwardChevronIcon()}
            tone="muted"
          />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Button
      accessibilityLabel={displayName}
      onPress={onPress}
      size="none"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
      tone="neutral"
      variant="ghost"
    >
      {content}
    </Button>
  );
}

export type AppointmentDetailsScreenProps = {
  appointmentId: string | undefined;
};

export function AppointmentDetailsScreen({
  appointmentId,
}: AppointmentDetailsScreenProps) {
  const { t } = useTranslation(["schedule", "common", "errors", "a11y"]);
  const database = useDatabase();
  const native = useNativeColors();
  const router = useRouter();
  const hourFormat = useHourFormat();
  const locale = useResolvedLocale();
  const { details, isLoading, error } = useAppointmentDetails(appointmentId);
  const openForEdit = useAddAppointmentStore((state) => state.openForEdit);
  const slideDuration = getAuthSlideDuration();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] =
    useState<FeedbackOverlayProps | null>(null);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/schedule" as Href);
  }, [router]);

  const dismissDeleteFeedback = useCallback(() => {
    setDeleteFeedback(null);
    setIsDeleting(false);
  }, []);

  const handleEdit = useCallback(() => {
    if (!details) {
      return;
    }

    const { appointment, patient, type, location } = details;
    openForEdit({
      appointmentId: appointment.id,
      patientId: appointment.patientId,
      patient: patient ? mapPatientToCardData(patient) : null,
      subject: appointment.subject?.trim() || "",
      typeId: type?.id ?? appointment.typeId ?? "",
      locationId: location?.id ?? appointment.locationId ?? "",
      start: appointment.startTime,
      end: appointment.endTime,
      description: appointment.description?.trim() || "",
    });
  }, [details, openForEdit]);

  const handleDelete = useCallback(() => {
    if (!details) {
      return;
    }

    setDeleteVisible(true);
  }, [details]);

  const handleCancelDelete = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setDeleteVisible(false);
  }, [isDeleting]);

  const handleConfirmDelete = useCallback(() => {
    if (!details || isDeleting) {
      return;
    }

    const appointment = details.appointment;
    setIsDeleting(true);
    setDeleteVisible(false);
    setDeleteFeedback({
      stage: "loading",
      title: t("schedule:details.deletingTitle"),
      message: t("schedule:details.deletingMessage"),
    });

    void (async () => {
      try {
        await database.write(async () => {
          await appointment.markAsDeleted();
        });
        requestSync();
        setDeleteFeedback({
          stage: "success",
          title: t("schedule:details.deletedTitle"),
          message: t("schedule:details.deletedMessage"),
          continueLabel: t("common:actions.done"),
          onContinue: () => {
            setDeleteFeedback(null);
            goBack();
          },
        });
      } catch (err) {
        setIsDeleting(false);
        setDeleteFeedback({
          stage: "error",
          title: t("errors:delete.unable"),
          message:
            err instanceof Error
              ? err.message
              : t("errors:generic.pleaseTryAgain"),
          retryLabel: t("common:actions.ok"),
          onRetry: dismissDeleteFeedback,
          onDismiss: dismissDeleteFeedback,
        });
      }
    })();
  }, [database, details, dismissDeleteFeedback, goBack, isDeleting, t]);

  const subject =
    details?.appointment.subject?.trim() || t("schedule:add.defaultSubject");
  const typeName = details?.type
    ? pickLocalizedName(details.type, locale) || null
    : null;
  const locationName = details?.location
    ? pickLocalizedName(details.location, locale) || null
    : null;
  const notes = details?.appointment.description?.trim() || null;

  const patientName = details?.patient
    ? formatPatientName(details.patient) || t("common:patient.unnamed")
    : t("schedule:details.noPatientLinked");
  const profilePhoto = details?.patient?.profilePhoto ?? null;
  const patientId = details?.patient?.id;

  const appointmentFields = useMemo((): DetailsField[] => {
    if (!details) {
      return [];
    }

    const timePattern = dayjsTimePattern(hourFormat);
    const dateLabel = dayjs(details.appointment.startTime).format(
      "D MMM, YYYY",
    );
    const startLabel = dayjs(details.appointment.startTime).format(timePattern);
    const endLabel = dayjs(details.appointment.endTime).format(timePattern);

    return [
      { label: t("schedule:details.subject"), value: subject },
      { label: t("common:labels.date"), value: dateLabel },
      { label: t("common:labels.time"), value: `${startLabel} – ${endLabel}` },
      {
        label: t("common:labels.type"),
        value: typeName ?? t("schedule:details.noType"),
        empty: !typeName,
      },
      {
        label: t("schedule:details.location"),
        value: locationName ?? t("schedule:details.noLocation"),
        empty: !locationName,
      },
    ];
  }, [details, hourFormat, locationName, subject, t, typeName]);

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

  if (error || !details) {
    return (
      <ThemedView
        contentClassName="items-center justify-center"
        inset="none"
        padBottom={false}
        scroll={false}
        variant="screen"
      >
        <EmptyState
          action={{
            label: t("schedule:details.backToSchedule"),
            onPress: goBack,
          }}
          description={
            error
              ? t("schedule:details.loadError")
              : t("schedule:details.notFound")
          }
          icon={calendarIcon}
          title={t("schedule:details.emptyTitle")}
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
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom:
            semantic.space.section +
            DETAILS_ACTION_BAR_HEIGHT +
            semantic.space.stack.compact,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeIn.duration(slideDuration).easing(AUTH_SLIDE_EASING)}
        >
          <PatientHero
            displayName={patientName}
            hasPatient={Boolean(patientId)}
            onPress={
              patientId
                ? () => router.push(`/patients/${patientId}` as Href)
                : undefined
            }
            profilePhoto={profilePhoto}
          />

          <View className="px-page pt-section">
            <DetailsSection
              fields={appointmentFields}
              note={{
                value: notes ?? t("common:empty.noNotes"),
                empty: !notes,
              }}
              title={t("schedule:details.title")}
            />
          </View>
        </Animated.View>
      </ScrollView>

      <DetailsActionBar
        items={[
          {
            icon: navBackChevronIcon(),
            label: t("common:actions.back"),
            onPress: goBack,
          },
          {
            icon: editIcon,
            label: t("common:actions.edit"),
            onPress: handleEdit,
          },
          {
            icon: deleteIcon,
            label: t("common:actions.delete"),
            onPress: handleDelete,
            tone: "alert",
          },
        ]}
      />

      <DeleteConfirmationDialog
        confirming={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        visible={deleteVisible}
      />

      {deleteFeedback ? (
        <Modal animationType="fade" statusBarTranslucent transparent visible>
          <View className="flex-1">
            <FeedbackOverlay {...deleteFeedback} />
          </View>
        </Modal>
      ) : null}
    </ThemedView>
  );
}
