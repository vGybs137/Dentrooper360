import { type Href, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { EntityListScreen } from "@/components/list";
import { PatientCard } from "@/components/patients/PatientCard";
import { PatientsListKpis } from "@/components/patients/PatientsListKpis";
import { personAddIcon, personsIcon } from "@/constants";
import type { PatientCardData } from "@/helpers/patients/patientDisplay";
import { useActivePatients } from "@/hooks/patients/useActivePatients";
import { useAddPatientStore, useAuthUser } from "@/stores";

export function PatientsListScreen() {
  const { t } = useTranslation(["patients", "a11y"]);
  const router = useRouter();
  const user = useAuthUser();
  const openAddPatient = useAddPatientStore((state) => state.open);
  const { patients, kpis, isLoading, error } = useActivePatients("", {
    sortBy: "fileDate",
  });

  const currencySymbol = user?.currencySymbol ?? null;

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

  const listHeader = useMemo(
    () => <PatientsListKpis currencySymbol={currencySymbol} kpis={kpis} />,
    [currencySymbol, kpis],
  );

  return (
    <EntityListScreen
      addAccessibilityLabel={t("a11y:addPatient")}
      addIcon={personAddIcon}
      data={patients}
      emptyAction={{
        label: t("patients:list.add"),
        onPress: handleOpenAddPatient,
      }}
      emptyIcon={personsIcon}
      emptyTitle={t("patients:list.empty")}
      error={error}
      errorMessage={t("patients:list.loadError")}
      isLoading={isLoading}
      keyExtractor={keyExtractor}
      listHeader={listHeader}
      onAdd={handleOpenAddPatient}
      openSearch={openSearch}
      renderItem={renderItem}
      searchAccessibilityLabel={t("a11y:searchPatients")}
      title={t("patients:list.title")}
    />
  );
}
