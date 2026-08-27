import { Image, View, type StyleProp, type ViewStyle } from "react-native";

import { Button, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import { checkCircleIcon, personIcon, starIcon } from "@/constants";
import {
  formatPatientBalance,
  formatPatientNextVisit,
  type PatientCardData,
} from "@/helpers/patientDisplay";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

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
    <View style={{ minWidth: 72, gap: 2 }}>
      <ThemedText tone="muted" style={{ fontSize: 12 }} variant="label">
        {label}
      </ThemedText>
      <ThemedText
        numberOfLines={1}
        style={{ fontWeight: "400" }}
        variant="label"
      >
        {value}
      </ThemedText>
    </View>
  );
}

function PatientAvatar({ profilePhoto }: { profilePhoto: string | null }) {
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
    <ThemedIcon dimension={AVATAR_SIZE} name={personIcon} tone="muted" />
  );
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  const native = useNativeColors();

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
    <View
      style={{
        width: INDICATOR_SIZE,
        height: INDICATOR_SIZE,
        borderRadius: INDICATOR_SIZE / 2,
        borderWidth: 2,
        borderColor: native.border.default,
        backgroundColor: native.surface.default,
      }}
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
      variant="card"
      style={[
        { backgroundColor: native.surface.sunken },
        isSelected
          ? {
              borderWidth: 2,
              borderColor: native.brand.default,
              backgroundColor: native.brand.subtle,
            }
          : undefined,
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "stretch" }}>
        <View
          style={{
            alignItems: "center",
            justifyContent: selectable ? "space-between" : "center",
            width: AVATAR_SIZE + 4,
            minHeight: selectable ? 72 : AVATAR_SIZE,
          }}
        >
          <PatientAvatar profilePhoto={patient.profilePhoto} />
          {selectable ? <SelectionIndicator selected={selected} /> : null}
        </View>

        <View className="h-[90%] border-border-subtle border-l self-center" />

        <View className="flex-1">
          <View
            style={{
              flex: 1,
              minWidth: 0,
              justifyContent: "center",
              paddingHorizontal: semantic.space.gap.default,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <ThemedText
                numberOfLines={1}
                style={{ flexShrink: 1, fontWeight: "600" }}
                variant="body"
              >
                {patient.displayName}
              </ThemedText>
              {patient.isVip ? (
                <ThemedIcon dimension={14} name={starIcon} tone="brand" />
              ) : null}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              paddingLeft: semantic.space.gap.default,
              paddingVertical: 2,
            }}
            className="flex-1 justify-between"
          >
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
