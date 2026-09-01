import { type Href, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

import { PatientCard } from "@/components/patients/PatientCard";
import { PatientsListHeader } from "@/components/patients/PatientsListHeader";
import { PatientsListKpis } from "@/components/patients/PatientsListKpis";
import { ThemedText, ThemedView } from "@/components/ui";
import type { PatientCardData } from "@/helpers/patientDisplay";
import { useActivePatients } from "@/hooks/useActivePatients";
import { useAddPatientStore, useAuthUser } from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

function PatientsListEmpty({
  error,
  isLoading,
}: {
  error: Error | null;
  isLoading: boolean;
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
      No active patients yet.
    </ThemedText>
  );
}

export function PatientsListScreen() {
  const router = useRouter();
  const user = useAuthUser();
  const openAddPatient = useAddPatientStore((state) => state.open);
  const { patients, kpis, isLoading, error } = useActivePatients("", {
    sortBy: "fileDate",
  });

  const openSearch = useCallback(() => {
    router.push("/patients/search" as Href);
  }, [router]);

  const handleOpenAddPatient = useCallback(() => {
    openAddPatient();
  }, [openAddPatient]);

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
    <PatientsListEmpty error={error} isLoading={isLoading} />
  );

  return (
    <ThemedView className="flex-1" scroll={false} variant="stack">
      <View className="z-10 gap-stack-compact bg-surface-default">
        <PatientsListHeader
          openAddPatient={handleOpenAddPatient}
          openSearch={openSearch}
        />
        <PatientsListKpis
          currencySymbol={user?.currencySymbol ?? null}
          kpis={kpis}
        />
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
