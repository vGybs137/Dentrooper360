/**
 * Route: `/appointments/[id]`
 * Screen UI: `components/schedule/appointmentDetails` (appointments → schedule asymmetry).
 */
import { useLocalSearchParams } from "expo-router";

import { AppointmentDetailsScreen } from "@/components/schedule/appointmentDetails/AppointmentDetailsScreen";

export default function AppointmentDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const appointmentId = Array.isArray(id) ? id[0] : id;

  return <AppointmentDetailsScreen appointmentId={appointmentId} />;
}
