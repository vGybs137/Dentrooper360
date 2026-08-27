import { SymbolView } from "expo-symbols";
import {
  Image,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { ThemedText, ThemedView } from "@/components/ui";
import { checkCircleIcon, personIcon, starIcon } from "@/constants";
import {
  formatPatientBalance,
  formatPatientNextVisit,
  type PatientCardData,
} from "@/helpers/patientDisplay";
import { useThemeTokens } from "@/theme";

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
  const theme = useThemeTokens();

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
    <SymbolView
      name={personIcon}
      size={AVATAR_SIZE}
      tintColor={theme.palette.foreground.muted}
    />
  );
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  const theme = useThemeTokens();

  if (selected) {
    return (
      <SymbolView
        name={checkCircleIcon}
        size={INDICATOR_SIZE}
        tintColor={theme.palette.brand.default}
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
        borderColor: theme.palette.border.default,
        backgroundColor: theme.palette.surface.default,
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
  const theme = useThemeTokens();
  const isSelected = selectable && selected;

  const content = (
    <ThemedView
      borderTone={isSelected ? "none" : "subtle"}
      variant="card"
      style={[
        { backgroundColor: theme.palette.surface.sunken },
        isSelected
          ? {
              borderWidth: 2,
              borderColor: theme.palette.brand.default,
              backgroundColor: theme.palette.brand.subtle,
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
              paddingHorizontal: theme.semantic.space.gap.default,
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
                <SymbolView
                  name={starIcon}
                  size={14}
                  tintColor={theme.palette.brand.default}
                />
              ) : null}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              paddingLeft: theme.semantic.space.gap.default,
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
    <Pressable
      accessibilityRole={selectable ? "radio" : "button"}
      accessibilityState={{ selected: isSelected }}
      android_ripple={
        selectable
          ? { color: theme.palette.brand.subtle, borderless: false }
          : undefined
      }
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
    >
      {content}
    </Pressable>
  );
}
