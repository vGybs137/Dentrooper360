import { useMemo } from "react";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedIcon, ThemedText } from "@/components/ui";
import { starIcon } from "@/constants";
import type Patient from "@/database/models/Patient";
import {
  formatPatientName,
  formatPatientPhone,
} from "@/helpers/patientDisplay";
import {
  initialsFromPatientName,
  patientInitialsColorsFromName,
} from "@/helpers/patientInitials";
import { useResolvedTheme } from "@/theme";
import { semantic } from "@/tokens";

const AVATAR_SIZE = 80;

type PatientDetailsHeroProps = {
  patient: Patient;
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

export function PatientDetailsHero({ patient }: PatientDetailsHeroProps) {
  const insets = useSafeAreaInsets();
  const displayName = formatPatientName(patient) || "Unnamed patient";
  const phone = formatPatientPhone(patient.countryCode, patient.phoneNumber);

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
      <HeroAvatar displayName={displayName} profilePhoto={patient.profilePhoto} />

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

      {phone ? (
        <ThemedText align="center" tone="muted" variant="body">
          {phone}
        </ThemedText>
      ) : null}
    </View>
  );
}
