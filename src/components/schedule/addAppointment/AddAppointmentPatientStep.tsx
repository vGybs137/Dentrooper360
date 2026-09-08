import { memo, useCallback } from "react";
import { useWatch } from "react-hook-form";
import { ActivityIndicator, View } from "react-native";

import { PatientCard } from "@/components/patients";
import { ThemedText, ThemedView } from "@/components/ui";
import type { AddAppointmentFormState } from "@/hooks/schedule/useAddAppointmentForm";
import type { AppointmentPatientOption } from "@/hooks/schedule/useAppointmentFormOptions";
import { useNativeColors } from "@/theme";

type AddAppointmentPatientStepProps = {
  formState: AddAppointmentFormState;
};

function PatientSearchDivider() {
  return <View className="h-px w-full bg-border-subtle" />;
}

function AddAppointmentPatientStepComponent({
  formState,
}: AddAppointmentPatientStepProps) {
  const native = useNativeColors();
  const { control, options, patientSearch, setPatientSearch, selectPatient } =
    formState;

  const patientId = useWatch({ control, name: "patientId" });

  const handlePatientPress = useCallback(
    (patient: AppointmentPatientOption) => {
      const nextId = patient.id === patientId ? null : patient.id;
      selectPatient(nextId, nextId ? patient : null);
    },
    [patientId, selectPatient],
  );

  return (
    <ThemedView space="default" variant="stack">
      <View className="w-full">
        <ThemedText
          as="input"
          autoCapitalize="none"
          autoCorrect={false}
          bottomSheetInput
          containerClassName="w-full"
          fieldVariant="bare"
          onChangeText={setPatientSearch}
          placeholder="Search patients..."
          returnKeyType="search"
          value={patientSearch}
        />
        <PatientSearchDivider />
      </View>

      {options.patientsLoading ? (
        <View className="items-center py-section">
          <ActivityIndicator color={native.brand.default} />
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
        <ThemedView space="compact" variant="stack">
          {options.patients.map((patient) => (
            <PatientCard
              key={patient.id}
              onPress={() => handlePatientPress(patient)}
              patient={patient}
              searchQuery={patientSearch}
              selectable
              selected={patient.id === patientId}
            />
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

export const AddAppointmentPatientStep = memo(
  AddAppointmentPatientStepComponent,
);
