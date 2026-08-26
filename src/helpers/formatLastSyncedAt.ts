import dayjs from "dayjs";

export function formatLastSyncedAt(timestamp: number | null): string {
  if (timestamp == null) {
    return "Never";
  }

  return dayjs(timestamp).format("MMM D · h:mm A");
}
