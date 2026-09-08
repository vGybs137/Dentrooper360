import { useMemo } from "react";
import { Image, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { PatientCardActionMenu } from "@/components/patients/PatientCardActionMenu";
import {
  Button,
  MetricColumn,
  SearchHighlightText,
  ThemedIcon,
  ThemedView,
} from "@/components/ui";
import { balanceIcon, calendarIcon, checkCircleIcon, starIcon } from "@/constants";
import {
  formatPatientBalance,
  formatPatientNextVisit,
  type PatientCardData,
} from "@/helpers/patients/patientDisplay";
import {
  initialsFromPatientName,
  patientInitialsColorsFromName,
} from "@/helpers/patients/patientInitials";
import { useAuthUser } from "@/stores";
import { useNativeColors, useResolvedTheme } from "@/theme";
import { cn } from "@/helpers/ui/cn";

const AVATAR_SIZE = 30;
const INDICATOR_SIZE = 22;

type PatientCardProps = {
  patient: PatientCardData;
  selectable?: boolean;
  selected?: boolean;
  onPress?: () => void;
  searchQuery?: string;
  style?: StyleProp<ViewStyle>;
};

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
        className="text-[11px] font-semibold"
        style={{ color: initialsColors.foreground }}
      >
        {initials}
      </Text>
    </View>
  );
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  if (selected) {
    return (
      <ThemedIcon
        dimension={INDICATOR_SIZE}
        name={checkCircleIcon}
        tone="brand"
      />
    );
  }

  return (
    <ThemedView
      className="rounded-full border-2 border-border-default bg-surface-default"
      style={{ width: INDICATOR_SIZE, height: INDICATOR_SIZE }}
    />
  );
}

export function PatientCard({
  patient,
  selectable = false,
  selected = false,
  onPress,
  searchQuery,
  style,
}: PatientCardProps) {
  const native = useNativeColors();
  const user = useAuthUser();
  const isSelected = selectable && selected;

  const content = (
    <ThemedView
      borderTone={isSelected ? "none" : "subtle"}
      className={cn(
        isSelected
          ? "border-2 border-brand-default bg-brand-subtle"
          : "bg-surface-sunken",
      )}
      style={style}
      variant="card"
    >
      <View className="flex-row items-start">
        <View
          className="items-center"
          style={{
            justifyContent: selectable ? "space-between" : "center",
            width: AVATAR_SIZE + 4,
            minHeight: selectable ? 72 : AVATAR_SIZE,
          }}
        >
          <PatientAvatar
            displayName={patient.displayName}
            profilePhoto={patient.profilePhoto}
          />
          {selectable ? <SelectionIndicator selected={selected} /> : null}
        </View>

        <View className="mx-3 h-[90%] w-0.5 self-center bg-border-subtle" />

        <View className="flex-1 gap-inset-compact">
          <View className="min-w-0 flex-1 justify-center px-gap">
            <View className="flex-row items-center gap-1.5">
              <SearchHighlightText
                className="min-w-0 flex-1 shrink font-semibold"
                numberOfLines={1}
                searchQuery={searchQuery}
                text={patient.displayName}
              />
              {patient.isVip ? (
                <ThemedIcon dimension={14} name={starIcon} tone="brand" />
              ) : null}
              {!selectable ? <PatientCardActionMenu patient={patient} /> : null}
            </View>
          </View>

          <View className="flex-1 flex-row justify-between py-0.5 pl-gap">
            <MetricColumn
              icon={calendarIcon}
              label="Next visit"
              value={formatPatientNextVisit(patient.nextVisit)}
            />
            <MetricColumn
              icon={balanceIcon}
              label="Balance"
              value={formatPatientBalance(
                patient.balance,
                user?.currencySymbol ?? patient.currency,
              )}
            />
          </View>
        </View>
      </View>
    </ThemedView>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Button
      accessibilityRole={selectable ? "radio" : "button"}
      accessibilityState={{ selected: isSelected }}
      android_ripple={
        selectable
          ? { color: native.brand.subtle, borderless: false }
          : undefined
      }
      onPress={onPress}
      ripple={false}
      size="none"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
      tone="neutral"
      variant="ghost"
    >
      {content}
    </Button>
  );
}
