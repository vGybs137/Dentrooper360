import { useLocalSearchParams } from "expo-router";

import { PatientDetailsScreen } from "@/components/patients/patientDetails/PatientDetailsScreen";

export default function PatientDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const patientId = Array.isArray(id) ? id[0] : id;

  return <PatientDetailsScreen patientId={patientId} />;
}
