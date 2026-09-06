import { useLocalSearchParams } from "expo-router";

import { RecallDetailsScreen } from "@/components/recalls/RecallDetailsScreen";

export default function RecallDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const recallId = Array.isArray(id) ? id[0] : id;

  return <RecallDetailsScreen recallId={recallId} />;
}
