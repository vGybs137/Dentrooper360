import dayjs from "dayjs";
import { useRouter, type Href } from "expo-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
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

import {
  FeedbackOverlay,
  type FeedbackOverlayProps,
} from "@/components/app/FeedbackOverlay";
import {
  InlineSelectColorLeading,
  InlineSelectSymbolLeading,
} from "@/components/schedule/addAppointment/AppointmentInlineSelect";
import {
  Button,
  DeleteConfirmationDialog,
  DetailsActionBar,
  DETAILS_ACTION_BAR_HEIGHT,
  ThemedIcon,
  ThemedText,
  ThemedView,
} from "@/components/ui";
import {
  chevronLeftIcon,
  clockIcon,
  deleteIcon,
  editIcon,
  locationIcon,
  notesIcon,
} from "@/constants";
import database from "@/database";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/auth/motion";
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
import { useAddAppointmentStore } from "@/stores";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { useNativeColors, useResolvedTheme } from "@/theme";
import { semantic } from "@/tokens";
import { cn } from "@/helpers/ui/cn";

const AVATAR_SIZE = 80;

const CHEVRON_RIGHT_ICON = {
  ios: "chevron.right",
  android: "chevron_right",
  web: "chevron_right",
} as const;

const ARROW_RIGHT_ICON = {
  ios: "arrow.right",
  android: "arrow_forward",
  web: "arrow_forward",
} as const;

function FormDivider({ className }: { className?: string }) {
  return <View className={cn("h-px w-full bg-border-subtle", className)} />;
}

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
            name={CHEVRON_RIGHT_ICON}
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

function ReadOnlyDateTime({
  startTime,
  endTime,
}: {
  startTime: Date;
  endTime: Date;
}) {
  const hourFormat = useHourFormat();
  const timePattern = dayjsTimePattern(hourFormat);
  const dateLabel = dayjs(startTime).format("D MMM, YYYY");
  const startLabel = dayjs(startTime).format(timePattern);
  const endLabel = dayjs(endTime).format(timePattern);
  return (
    <View className="gap-gap-compact">
      <View className="items-start gap-2">
        <View className="flex-row items-center gap-3">
          <ThemedIcon dimension={20} name={clockIcon} tone="muted" />
          <View className="justify-center rounded-pill px-inline py-stack-compact">
            <ThemedText variant="body">{dateLabel}</ThemedText>
          </View>
        </View>

        <View className="ml-8 flex-row items-center gap-2">
          <View className="justify-center rounded-pill px-inline py-stack-compact">
            <ThemedText variant="body">{startLabel}</ThemedText>
          </View>

          <ThemedIcon dimension={14} name={ARROW_RIGHT_ICON} tone="muted" />

          <View className="justify-center rounded-pill px-inline py-stack-compact">
            <ThemedText variant="body">{endLabel}</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

function DetailSelectRow({
  leading,
  label,
  muted,
}: {
  leading: ReactNode;
  label: string;
  muted?: boolean;
}) {
  return (
    <View className="w-full flex-row items-center gap-3">
      <View className="size-5 shrink-0 items-center justify-center">
        {leading}
      </View>
      <View className="min-h-control min-w-0 flex-1 justify-center rounded-pill px-inline py-stack-compact">
        <ThemedText tone={muted ? "muted" : "default"} variant="body">
          {label}
        </ThemedText>
      </View>
    </View>
  );
}

export type AppointmentDetailsScreenProps = {
  appointmentId: string | undefined;
};

export function AppointmentDetailsScreen({
  appointmentId,
}: AppointmentDetailsScreenProps) {
  const native = useNativeColors();
  const router = useRouter();
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
      title: "Deleting...",
      message: "Removing this appointment.",
    });

    void (async () => {
      try {
        await database.write(async () => {
          await appointment.markAsDeleted();
        });
        requestSync();
        setDeleteFeedback({
          stage: "success",
          title: "Appointment deleted",
          message: "The appointment was removed.",
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
  }, [details, dismissDeleteFeedback, goBack, isDeleting]);

  const title = details?.appointment.subject?.trim() || "Appointment";
  const typeName = details?.type?.nameEn?.trim() || null;
  const typeColor = details?.type?.color ?? undefined;
  const locationName = details?.location?.nameEn?.trim() || null;
  const notes = details?.appointment.description?.trim() || null;

  const patientName = details?.patient
    ? formatPatientName(details.patient) || "Unnamed patient"
    : "No patient linked";
  const profilePhoto = details?.patient?.profilePhoto ?? null;
  const patientId = details?.patient?.id;

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
        contentClassName="items-center justify-center px-page"
        inset="none"
        padBottom={false}
        scroll={false}
        variant="screen"
      >
        <ThemedView align="center" space="default" variant="stack">
          <ThemedText align="center" tone={error ? "alert" : "muted"}>
            {error
              ? "Unable to load this appointment."
              : "This appointment could not be found."}
          </ThemedText>
          <Button
            label="Back to schedule"
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

          <View
            style={{
              paddingHorizontal: semantic.space.inline.default,
              paddingTop: semantic.space.section,
            }}
          >
            <ThemedView space="default" variant="stack">
              <ThemedText variant="body">{title}</ThemedText>

              <FormDivider className="mt-2" />

              <ReadOnlyDateTime
                endTime={details.appointment.endTime}
                startTime={details.appointment.startTime}
              />

              <FormDivider />

              <DetailSelectRow
                label={typeName ?? "No type"}
                leading={<InlineSelectColorLeading color={typeColor} />}
                muted={!typeName}
              />

              <FormDivider />

              <DetailSelectRow
                label={locationName ?? "No location"}
                leading={
                  <InlineSelectSymbolLeading name={locationIcon} />
                }
                muted={!locationName}
              />

              <FormDivider />

              <View className="w-full flex-row items-start gap-3">
                <View className="mt-stack-compact size-5 items-center justify-center">
                  <ThemedIcon dimension={20} name={notesIcon} tone="muted" />
                </View>
                <View className="min-w-0 flex-1">
                  <ThemedText
                    className="min-h-[96px] w-full px-inline"
                    tone={notes ? "default" : "muted"}
                    variant="body"
                  >
                    {notes ?? "No notes"}
                  </ThemedText>
                </View>
              </View>
            </ThemedView>
          </View>
        </Animated.View>
      </ScrollView>

      <DetailsActionBar
        items={[
          { icon: chevronLeftIcon, label: "Back", onPress: goBack },
          { icon: editIcon, label: "Edit", onPress: handleEdit },
          {
            icon: deleteIcon,
            label: "Delete",
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
