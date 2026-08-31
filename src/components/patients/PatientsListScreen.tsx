import { type Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

import { PatientCard } from "@/components/patients/PatientCard";
import { ThemedText, ThemedView } from "@/components/ui";
import type { PatientCardData } from "@/helpers/patientDisplay";
import { useActivePatients } from "@/hooks/useActivePatients";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

function PatientSearchDivider() {
  return <View className="h-px w-full bg-border-subtle" />;
}

function PatientsListEmpty({
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
        : "No active patients yet."}
    </ThemedText>
  );
}

export function PatientsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { patients, isLoading, error } = useActivePatients(search, {
    sortBy: "fileDate",
  });

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

  const listEmptyComponent = (
    <PatientsListEmpty error={error} isLoading={isLoading} search={search} />
  );

  return (
    <ThemedView className="flex-1" scroll={false} space="default" variant="stack">
      <View className="w-full">
        <ThemedText
          as="input"
          autoCapitalize="none"
          autoCorrect={false}
          containerClassName="w-full"
          fieldVariant="bare"
          onChangeText={setSearch}
          placeholder="Search patients..."
          returnKeyType="search"
          value={search}
        />
        <PatientSearchDivider />
      </View>

      <FlatList
        contentContainerStyle={{
          gap: semantic.space.gap.compact,
          flexGrow: patients.length === 0 ? 1 : undefined,
          paddingBottom: semantic.space.page,
        }}
        data={patients}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmptyComponent}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      />
    </ThemedView>
  );
}
