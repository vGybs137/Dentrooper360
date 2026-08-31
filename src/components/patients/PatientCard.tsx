import { Image, View, type StyleProp, type ViewStyle } from "react-native";

import { Button, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { checkCircleIcon, starIcon } from "@/constants";
import {
  formatPatientBalance,
  formatPatientNextVisit,
  type PatientCardData,
} from "@/helpers/patientDisplay";
import { useNativeColors } from "@/theme";
import { cn } from "@/utils/cn";

const AVATAR_SIZE = 30;
const INDICATOR_SIZE = 22;

type PatientCardProps = {
  patient: PatientCardData;
  selectable?: boolean;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function MetricColumn({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[72px] gap-0.5">
      <ThemedText className="text-xs" tone="muted" variant="label">
        {label}
      </ThemedText>
      <ThemedText className="font-normal" numberOfLines={1} variant="label">
        {value}
      </ThemedText>
    </View>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function PatientAvatar({
  displayName,
  profilePhoto,
}: {
  displayName: string;
  profilePhoto: string | null;
}) {
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
    <ThemedView
      className="items-center justify-center rounded-full bg-brand-subtle"
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
    >
      <ThemedText className="text-[11px] font-semibold" tone="brand" variant="label">
        {initialsFromName(displayName)}
      </ThemedText>
    </ThemedView>
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
  style,
}: PatientCardProps) {
  const native = useNativeColors();
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
      <View className="flex-row items-stretch">
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

        <View className="flex-1">
          <View className="min-w-0 flex-1 justify-center px-gap">
            <View className="flex-row flex-wrap items-center gap-1.5">
              <ThemedText
                className="shrink font-semibold"
                numberOfLines={1}
                variant="body"
              >
                {patient.displayName}
              </ThemedText>
              {patient.isVip ? (
                <ThemedIcon dimension={14} name={starIcon} tone="brand" />
              ) : null}
            </View>
          </View>

          <View className="flex-1 flex-row justify-between py-0.5 pl-gap">
            <MetricColumn
              label="Next visit"
              value={formatPatientNextVisit(patient.nextVisit)}
            />
            <MetricColumn
              label="Balance"
              value={formatPatientBalance(patient.balance, patient.currency)}
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
