import { useCallback, useMemo } from "react";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Button,
  ThemedIcon,
  ThemedText,
  type ThemedIconProps,
} from "@/components/ui";
import {
  addAppointmentIcon,
  calendarIcon,
  messageIcon,
  personIcon,
  starIcon,
} from "@/constants";
import { patientPhoneDigits } from "@/helpers/patientContact";
import { formatPatientName } from "@/helpers/patientDisplay";
import {
  initialsFromPatientName,
  patientInitialsColorsFromName,
} from "@/helpers/patientInitials";
import type { PatientDetailsData } from "@/hooks/usePatientDetails";
import { useResolvedTheme } from "@/theme";
import { semantic } from "@/tokens";

const AVATAR_SIZE = 80;
const CTA_ICON_SIZE = 44;

type RecallDetailsHeroProps = {
  patient: PatientDetailsData;
  hasAppointment: boolean;
  onViewPatient: () => void;
  onAppointment: () => void;
  onMessage: () => void;
};

function HeroAvatar({
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

function HeroCta({
  accessibilityLabel,
  disabled,
  icon,
  label,
  onPress,
}: {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  onPress: () => void;
}) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      className="min-w-0 flex-1 items-center gap-1.5 py-1"
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      size="none"
      style={({ pressed }) =>
        pressed && !disabled ? { opacity: 0.7 } : undefined
      }
      tone="neutral"
      variant="ghost"
    >
      <View
        className="items-center justify-center rounded-full bg-brand-subtle"
        style={{ width: CTA_ICON_SIZE, height: CTA_ICON_SIZE }}
      >
        <ThemedIcon
          dimension={22}
          name={icon}
          tone={disabled ? "muted" : "brand"}
        />
      </View>
      <ThemedText
        align="center"
        className="font-medium"
        numberOfLines={2}
        tone={disabled ? "muted" : "default"}
        variant="label"
      >
        {label}
      </ThemedText>
    </Button>
  );
}

export function RecallDetailsHero({
  patient,
  hasAppointment,
  onViewPatient,
  onAppointment,
  onMessage,
}: RecallDetailsHeroProps) {
  const insets = useSafeAreaInsets();
  const displayName = formatPatientName(patient) || "Unnamed patient";
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
      <HeroAvatar
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
        <HeroCta
          accessibilityLabel="View patient"
          icon={personIcon}
          label="Patient"
          onPress={onViewPatient}
        />
        <HeroCta
          accessibilityLabel={
            hasAppointment ? "View appointment" : "Add appointment"
          }
          icon={hasAppointment ? calendarIcon : addAppointmentIcon}
          label={"Appointment"}
          onPress={onAppointment}
        />
        <HeroCta
          accessibilityLabel="Message patient"
          disabled={!hasPhone}
          icon={messageIcon}
          label="Message"
          onPress={handleMessage}
        />
      </View>
    </View>
  );
}
