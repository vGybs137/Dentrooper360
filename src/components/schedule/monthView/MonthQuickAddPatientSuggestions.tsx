import { memo, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { SearchHighlightText } from "@/components/ui";
import {
  formatPatientPhone,
  type PatientCardData,
} from "@/helpers/patients/patientDisplay";
import {
  initialsFromPatientName,
  patientInitialsColorsFromName,
} from "@/helpers/patients/patientInitials";
import { useNativeColors, useResolvedTheme } from "@/theme";
import { semantic } from "@/tokens";

const AVATAR_SIZE = 36;
const ROW_MIN_HEIGHT = 64;
const MAX_VISIBLE_ROWS = 4;

export type MonthQuickAddPatientSuggestionsProps = {
  patients: readonly PatientCardData[];
  searchQuery: string;
  onSelect: (patient: PatientCardData) => void;
};

function SuggestionInitials({ displayName }: { displayName: string }) {
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
        className="text-[12px] font-semibold"
        style={{ color: initialsColors.foreground }}
      >
        {initials}
      </Text>
    </View>
  );
}

function MonthQuickAddPatientSuggestionsComponent({
  patients,
  searchQuery,
  onSelect,
}: MonthQuickAddPatientSuggestionsProps) {
  const native = useNativeColors();
  const maxHeight = ROW_MIN_HEIGHT * Math.min(patients.length, MAX_VISIBLE_ROWS);

  return (
    <View
      className="overflow-hidden rounded-card border border-border-subtle"
      style={{
        maxHeight,
        backgroundColor: native.surface.raised,
        shadowColor: native.foreground.default,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: semantic.elevation.raised,
      }}
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        style={{ maxHeight }}
      >
        {patients.map((patient, index) => {
          const phone =
            formatPatientPhone(patient.countryCode, patient.phoneNumber) ??
            "No phone";

          return (
            <View key={patient.id}>
              {index > 0 ? (
                <View className="h-px w-full bg-border-subtle" />
              ) : null}
              <Pressable
                accessibilityLabel={`Select ${patient.displayName}, ${phone}`}
                accessibilityRole="button"
                onPress={() => onSelect(patient)}
                style={({ pressed }) => ({
                  minHeight: ROW_MIN_HEIGHT,
                  opacity: pressed ? 0.7 : 1,
                  paddingHorizontal: semantic.space.section,
                  paddingVertical: semantic.space.stack.default,
                  justifyContent: "center",
                })}
              >
                <View className="min-w-0 flex-row items-center gap-3">
                  <SuggestionInitials displayName={patient.displayName} />
                  <View className="min-w-0 flex-1 gap-0.5">
                    <SearchHighlightText
                      className="min-w-0 font-semibold"
                      numberOfLines={1}
                      searchQuery={searchQuery}
                      text={patient.displayName}
                    />
                    <SearchHighlightText
                      className="min-w-0"
                      numberOfLines={1}
                      searchQuery={searchQuery}
                      text={phone}
                      tone="muted"
                      toneClassName="text-foreground-muted"
                      variant="label"
                    />
                  </View>
                </View>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const MonthQuickAddPatientSuggestions = memo(
  MonthQuickAddPatientSuggestionsComponent,
);
