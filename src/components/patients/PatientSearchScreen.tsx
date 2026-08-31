import { type Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PatientCard } from "@/components/patients/PatientCard";
import { Button, ThemedIcon, ThemedText, ThemedView } from "@/components/ui";
import type { PatientCardData } from "@/helpers/patientDisplay";
import { useActivePatients } from "@/hooks/useActivePatients";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const CHEVRON_LEFT_ICON = {
  ios: "chevron.left",
  android: "chevron_left",
  web: "chevron_left",
} as const;

function PatientSearchEmpty({
  error,
  isLoading,
  search,
}: {
  error: Error | null;
  isLoading: boolean;
  search: string;
}) {
  const native = useNativeColors();

  if (isLoading) {
    return (
      <View className="items-center py-6">
        <ActivityIndicator color={native.brand.default} />
      </View>
    );
  }

  if (error) {
    return (
      <ThemedText align="center" tone="alert" variant="body">
        Unable to load patients.
      </ThemedText>
    );
  }

  return (
    <ThemedText align="center" tone="muted" variant="body">
      {search.trim().length > 0
        ? "No patients match your search."
        : "Search by patient name."}
    </ThemedText>
  );
}

export function PatientSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const { patients, isLoading, error } = useActivePatients(search, {
    sortBy: "fileDate",
  });

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/patients" as Href);
  }, [router]);

  const handlePatientPress = useCallback(
    (patient: PatientCardData) => {
      router.push(`/patients/${patient.id}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: PatientCardData }) => (
      <PatientCard onPress={() => handlePatientPress(item)} patient={item} />
    ),
    [handlePatientPress],
  );

  const keyExtractor = useCallback((item: PatientCardData) => item.id, []);

  return (
    <ThemedView
      edges={["left", "right"]}
      inset="compact"
      keyboardAvoiding
      padBottom={false}
      scroll={false}
      variant="screen"
      style={{ paddingTop: insets.top }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingBottom: semantic.space.stack.compact,
        }}
      >
        <Button
          accessibilityLabel="Back to patients"
          hitSlop={8}
          onPress={goBack}
          size="none"
          style={{
            width: semantic.size.touch,
            height: semantic.size.touch,
            alignItems: "flex-start",
            justifyContent: "center",
          }}
          tone="neutral"
          variant="ghost"
        >
          <ThemedIcon name={CHEVRON_LEFT_ICON} />
        </Button>
        <ThemedText
          as="input"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          containerClassName="flex-1 min-w-0"
          fieldVariant="bare"
          onChangeText={setSearch}
          placeholder="Search patients..."
          returnKeyType="search"
          value={search}
        />
      </View>

      <FlatList
        contentContainerStyle={{
          gap: semantic.space.gap.compact,
          flexGrow: patients.length === 0 ? 1 : undefined,
          paddingBottom: semantic.space.page + insets.bottom,
        }}
        data={patients}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <PatientSearchEmpty
            error={error}
            isLoading={isLoading}
            search={search}
          />
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />
    </ThemedView>
  );
}
