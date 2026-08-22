import { SymbolView } from "expo-symbols";
import { ActivityIndicator, View } from "react-native";
import { useWatch } from "react-hook-form";

import { PatientCard } from "@/components/patients";
import { Stack, TextField, ThemedText } from "@/components/ui";
import { searchIcon } from "@/constants";
import type { AddAppointmentFormState } from "@/hooks/useAddAppointmentForm";
import { useThemeTokens } from "@/theme";

type AddAppointmentPatientStepProps = {
  formState: AddAppointmentFormState;
};

export function AddAppointmentPatientStep({
  formState,
}: AddAppointmentPatientStepProps) {
  const theme = useThemeTokens();
  const {
    form,
    options,
    patientSearch,
    setPatientSearch,
    selectPatient,
  } = formState;

  const patientId = useWatch({
    control: form.control,
    name: "patientId",
  });

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

      {options.isLoading ? (
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
        <Stack space="compact">
          {options.patients.map((patient) => (
            <PatientCard
              key={patient.id}
              onPress={() =>
                selectPatient(patient.id === patientId ? null : patient.id)
              }
              patient={patient}
              selectable
              selected={patient.id === patientId}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
