import dayjs from "dayjs";
import { useRouter, type Href } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  InlineSelectColorLeading,
  InlineSelectSymbolLeading,
} from "@/components/schedule/addAppointment/AppointmentInlineSelect";
import {
  Button,
  DeleteConfirmationDialog,
  ThemedText,
  ThemedView,
} from "@/components/ui";
import { clockIcon, locationIcon, notesIcon, personIcon } from "@/constants";
import database from "@/database";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/authMotion";
import {
  formatPatientName,
  mapPatientToCardData,
} from "@/helpers/patientDisplay";
import { requestSync } from "@/helpers/requestSync";
import { dayjsTimePattern } from "@/helpers/timeFormat";
import { useAppointmentDetails } from "@/hooks/useAppointmentDetails";
import { useAddAppointmentStore } from "@/stores";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { useThemeTokens } from "@/theme";
import { cn } from "@/utils/cn";

const AVATAR_SIZE = 80;
const ACTION_BAR_HEIGHT = 64;

const CHEVRON_RIGHT_ICON = {
  ios: "chevron.right",
  android: "chevron_right",
  web: "chevron_right",
} as const;

const CHEVRON_LEFT_ICON = {
  ios: "chevron.left",
  android: "chevron_left",
  web: "chevron_left",
} as const;

const ARROW_RIGHT_ICON = {
  ios: "arrow.right",
  android: "arrow_forward",
  web: "arrow_forward",
} as const;

const EDIT_ICON = {
  ios: "pencil",
  android: "edit",
  web: "edit",
} as const;

const DELETE_ICON = {
  ios: "trash",
  android: "delete",
  web: "delete",
} as const;

function FormDivider({ className }: { className?: string }) {
  return <View className={cn("h-px w-full bg-border-subtle", className)} />;
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
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      className="w-full items-center"
      style={{
        backgroundColor: theme.palette.surface.sunken,
        borderBottomLeftRadius: theme.semantic.radius.dialog,
        borderBottomRightRadius: theme.semantic.radius.dialog,
        paddingTop: insets.top + theme.semantic.space.section,
        paddingBottom: theme.semantic.space.section,
        gap: theme.semantic.space.stack.default,
      }}
    >
      {hasPatient ? (
        profilePhoto ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: profilePhoto }}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: AVATAR_SIZE / 2,
              backgroundColor: theme.palette.surface.sunken,
            }}
          />
        ) : (
          <SymbolView
            name={personIcon}
            size={AVATAR_SIZE}
            tintColor={theme.palette.foreground.muted}
          />
        )
      ) : null}

      <View
        className="w-full flex-row items-center"
        style={{
          paddingHorizontal: theme.semantic.space.inline.default,
          gap: theme.semantic.space.gap.compact,
        }}
      >
        <ThemedText
          align="center"
          className="min-w-0 flex-1"
          numberOfLines={2}
          style={{
            fontWeight: theme.primitives.fontWeight.semibold,
          }}
          variant="title"
        >
          {displayName}
        </ThemedText>
        {onPress ? (
          <SymbolView
            name={CHEVRON_RIGHT_ICON}
            size={35}
            tintColor={theme.palette.foreground.muted}
          />
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityLabel={displayName}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      {content}
    </Pressable>
  );
}

function ReadOnlyDateTime({
  startTime,
  endTime,
}: {
  startTime: Date;
  endTime: Date;
}) {
  const theme = useThemeTokens();
  const hourFormat = useHourFormat();
  const timePattern = dayjsTimePattern(hourFormat);
  const dateLabel = dayjs(startTime).format("D MMM, YYYY");
  const startLabel = dayjs(startTime).format(timePattern);
  const endLabel = dayjs(endTime).format(timePattern);
  return (
    <View className="gap-gap-compact">
      <View className="items-start gap-2">
        <View className="flex-row items-center gap-3">
          <SymbolView
            name={clockIcon}
            size={20}
            tintColor={theme.palette.foreground.muted}
          />
          <View className="justify-center rounded-pill px-inline py-stack-compact">
            <ThemedText variant="body">{dateLabel}</ThemedText>
          </View>
        </View>

        <View className="ml-8 flex-row items-center gap-2">
          <View className="justify-center rounded-pill px-inline py-stack-compact">
            <ThemedText variant="body">{startLabel}</ThemedText>
          </View>

          <SymbolView
            name={ARROW_RIGHT_ICON}
            size={14}
            tintColor={theme.palette.foreground.muted}
          />

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

function DetailsActionItem({
  icon,
  label,
  onPress,
  tone = "default",
}: {
  icon: React.ComponentProps<typeof SymbolView>["name"];
  label: string;
  onPress: () => void;
  tone?: "default" | "alert";
}) {
  const theme = useThemeTokens();
  const color =
    tone === "alert"
      ? theme.palette.alert.DEFAULT
      : theme.palette.foreground.default;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-w-0 flex-1 items-center justify-center gap-1 py-stack-compact"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
    >
      <SymbolView name={icon} size={22} tintColor={color} />
      <ThemedText
        style={{ color, fontWeight: theme.primitives.fontWeight.medium }}
        variant="label"
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

function DetailsActionBar({
  onBack,
  onEdit,
  onDelete,
}: {
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useThemeTokens();

  return (
    <View
      style={{
        paddingHorizontal: theme.semantic.space.inline.default,
        paddingBottom: theme.semantic.space.stack.compact,
      }}
    >
      <View
        className="flex-row items-stretch"
        style={{
          backgroundColor: theme.palette.surface.default,
          borderColor: theme.palette.border.subtle,
          borderWidth: theme.semantic.borderWidth.subtle,
          borderRadius: theme.semantic.radius.card,
          minHeight: ACTION_BAR_HEIGHT,
        }}
      >
        <DetailsActionItem
          icon={CHEVRON_LEFT_ICON}
          label="Back"
          onPress={onBack}
        />
        <DetailsActionItem icon={EDIT_ICON} label="Edit" onPress={onEdit} />
        <DetailsActionItem
          icon={DELETE_ICON}
          label="Delete"
          onPress={onDelete}
          tone="alert"
        />
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
  const theme = useThemeTokens();
  const router = useRouter();
  const { details, isLoading, error } = useAppointmentDetails(appointmentId);
  const openForEdit = useAddAppointmentStore((state) => state.openForEdit);
  const slideDuration = getAuthSlideDuration(theme);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/schedule" as Href);
  }, [router]);

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

    void (async () => {
      try {
        await database.write(async () => {
          await appointment.markAsDeleted();
        });
        requestSync();
        setDeleteVisible(false);
        goBack();
      } catch (err) {
        setIsDeleting(false);
        Alert.alert(
          "Unable to delete",
          err instanceof Error ? err.message : "Please try again.",
        );
      }
    })();
  }, [details, goBack, isDeleting]);

  const title = details?.appointment.subject?.trim() || "Appointment";
  const typeName = details?.type?.nameEn?.trim() || null;
  const typeColor =
    details?.type?.color ?? theme.palette.foreground.muted;
  const locationName = details?.location?.nameEn?.trim() || null;
  const notes = details?.appointment.description?.trim() || null;

  const patientName = details?.patient
    ? formatPatientName(details.patient) || "Unnamed patient"
    : "No patient linked";
  const profilePhoto = details?.patient?.profilePhoto ?? null;
  const patientId = details?.patient?.id;

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.palette.surface.default }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={theme.palette.brand.default} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.palette.surface.default }}
      >
        <View className="flex-1 items-center justify-center px-page">
          <ThemedView align="center" space="default" variant="stack">
            <ThemedText align="center" tone="muted">
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
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      edges={["bottom", "left", "right"]}
      style={{ backgroundColor: theme.palette.surface.default }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom:
            theme.semantic.space.section +
            ACTION_BAR_HEIGHT +
            theme.semantic.space.stack.compact,
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
              paddingHorizontal: theme.semantic.space.inline.default,
              paddingTop: theme.semantic.space.section,
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
                  <InlineSelectSymbolLeading
                    name={locationIcon}
                    tintColor={theme.palette.foreground.muted}
                  />
                }
                muted={!locationName}
              />

              <FormDivider />

              <View className="w-full flex-row items-start gap-3">
                <View className="mt-stack-compact size-5 items-center justify-center">
                  <SymbolView
                    name={notesIcon}
                    size={20}
                    tintColor={theme.palette.foreground.muted}
                  />
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
        onBack={goBack}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      <DeleteConfirmationDialog
        confirming={isDeleting}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        visible={deleteVisible}
      />
    </SafeAreaView>
  );
}
