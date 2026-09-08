import { useMemo } from "react";
import { Image, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import {
  ThemedIcon,
  type ThemedIconProps,
} from "@/components/ui/ThemedIcon";
import { ThemedText } from "@/components/ui/ThemedText";
import {
  DETAILS_HERO_AVATAR_SIZE,
  DETAILS_HERO_CTA_ICON_SIZE,
} from "@/constants/accents";
import {
  initialsFromPatientName,
  patientInitialsColorsFromName,
} from "@/helpers/patients/patientInitials";
import { useResolvedTheme } from "@/theme";

export type DetailsHeroAvatarProps = {
  displayName: string;
  profilePhoto: string | null;
  size?: number;
};

export function DetailsHeroAvatar({
  displayName,
  profilePhoto,
  size = DETAILS_HERO_AVATAR_SIZE,
}: DetailsHeroAvatarProps) {
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
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
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

export type DetailsHeroCtaProps = {
  accessibilityLabel: string;
  disabled?: boolean;
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  onPress: () => void;
};

export function DetailsHeroCta({
  accessibilityLabel,
  disabled,
  icon,
  label,
  onPress,
}: DetailsHeroCtaProps) {
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
        style={{
          width: DETAILS_HERO_CTA_ICON_SIZE,
          height: DETAILS_HERO_CTA_ICON_SIZE,
        }}
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
