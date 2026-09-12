import { useRouter, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { PatientCard } from "@/components/patients/PatientCard";
import { EntitySearchScreen } from "@/components/search";
import type { PatientCardData } from "@/helpers/patients/patientDisplay";
import { useActivePatients } from "@/hooks/patients/useActivePatients";

export function PatientSearchScreen() {
  const { t } = useTranslation(["patients", "a11y", "common"]);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const hasQuery = query.trim().length > 0;
  const { patients, isLoading, error } = useActivePatients(query, {
    sortBy: "fileDate",
    enabled: hasQuery,
  });

  const handlePatientPress = useCallback(
    (patient: PatientCardData) => {
      router.push(`/patients/${patient.id}` as Href);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: PatientCardData }) => (
      <View className="px-page pb-stack-compact">
        <PatientCard
          onPress={() => handlePatientPress(item)}
          patient={item}
          searchQuery={query}
        />
      </View>
    ),
    [handlePatientPress, query],
  );

  const keyExtractor = useCallback((item: PatientCardData) => item.id, []);

  return (
    <EntitySearchScreen
      data={hasQuery ? patients : []}
      entityLabel={t("patients:search.entityLabel")}
      error={error}
      fallbackHref={"/(tabs)/patients" as Href}
      hasQuery={hasQuery}
      isLoading={isLoading}
      keyExtractor={keyExtractor}
      onChangeQuery={setQuery}
      query={query}
      renderItem={renderItem}
      searchAccessibilityLabel={t("a11y:searchPatients")}
      searchPlaceholder={t("patients:search.placeholder")}
    />
  );
}
