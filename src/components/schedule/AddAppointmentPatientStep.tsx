import { SymbolView } from "expo-symbols";
import { memo, useCallback } from "react";
import { useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  FlatList,
  View,
  type ListRenderItem,
} from "react-native";

import { PatientCard } from "@/components/patients";
import { Stack, TextField, ThemedText } from "@/components/ui";
import { searchIcon } from "@/constants";
import type { AddAppointmentFormState } from "@/hooks/useAddAppointmentForm";
import type { AppointmentPatientOption } from "@/hooks/useAppointmentFormOptions";
import { useThemeTokens } from "@/theme";

/** Approximate selectable PatientCard height including stack gap. */
const PATIENT_CARD_STRIDE = 108;

type AddAppointmentPatientStepProps = {
  formState: AddAppointmentFormState;
};

function AddAppointmentPatientStepComponent({
  formState,
}: AddAppointmentPatientStepProps) {
  const theme = useThemeTokens();
  const {
    control,
    options,
    patientSearch,
    setPatientSearch,
    selectPatient,
  } = formState;

  const patientId = useWatch({ control, name: "patientId" });

  const handlePatientPress = useCallback(
    (patient: AppointmentPatientOption) => {
      const nextId = patient.id === patientId ? null : patient.id;
      selectPatient(nextId, nextId ? patient : null);
    },
    [patientId, selectPatient],
  );

  const renderPatient: ListRenderItem<AppointmentPatientOption> = useCallback(
    ({ item }) => (
      <PatientCard
        onPress={() => handlePatientPress(item)}
        patient={item}
        selectable
        selected={item.id === patientId}
        style={{ marginBottom: theme.semantic.space.stack.compact }}
      />
    ),
    [handlePatientPress, patientId, theme.semantic.space.stack.compact],
  );

  const keyExtractor = useCallback(
    (item: AppointmentPatientOption) => item.id,
    [],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: PATIENT_CARD_STRIDE,
      offset: PATIENT_CARD_STRIDE * index,
      index,
    }),
    [],
  );

  return (
    <Stack space="default">
      <TextField
        leading={
          <SymbolView
            name={searchIcon}
            size={18}
            tintColor={theme.palette.foreground.muted}
          />
        }
        onChangeText={setPatientSearch}
        placeholder="Search patients..."
        size="lg"
        value={patientSearch}
      />

      {options.patientsLoading ? (
        <View className="items-center py-6">
          <ActivityIndicator color={theme.palette.brand.default} />
        </View>
      ) : options.error ? (
        <ThemedText tone="alert" variant="body">
          Unable to load patients.
        </ThemedText>
      ) : options.patients.length === 0 ? (
        <ThemedText align="center" tone="muted" variant="body">
          No patients match your search.
        </ThemedText>
      ) : (
        <FlatList
          data={options.patients}
          getItemLayout={getItemLayout}
          initialNumToRender={8}
          keyExtractor={keyExtractor}
          keyboardShouldPersistTaps="handled"
          maxToRenderPerBatch={8}
          nestedScrollEnabled
          renderItem={renderPatient}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          windowSize={5}
        />
      )}
    </Stack>
  );
}

export const AddAppointmentPatientStep = memo(
  AddAppointmentPatientStepComponent,
);
