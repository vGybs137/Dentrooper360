import { memo, useCallback } from "react";
import { useWatch } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";

import { PatientCard } from "@/components/patients";
import { Stack, TextField, ThemedText } from "@/components/ui";
import type { AddAppointmentFormState } from "@/hooks/useAddAppointmentForm";
import type { AppointmentPatientOption } from "@/hooks/useAppointmentFormOptions";
import { useThemeTokens } from "@/theme";

type AddAppointmentPatientStepProps = {
  formState: AddAppointmentFormState;
};

function PatientSearchDivider() {
  return <View className="h-px w-full bg-border-subtle" />;
}

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

  return (
    <Stack space="default">
      <View className="w-full">
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          bottomSheetInput
          containerClassName="w-full"
          onChangeText={setPatientSearch}
          placeholder="Search patients..."
          returnKeyType="search"
          value={patientSearch}
          variant="bare"
        />
        <PatientSearchDivider />
      </View>

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
        <Stack space="compact">
          {options.patients.map((patient) => (
            <PatientCard
              key={patient.id}
              onPress={() => handlePatientPress(patient)}
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

export const AddAppointmentPatientStep = memo(
  AddAppointmentPatientStepComponent,
);
