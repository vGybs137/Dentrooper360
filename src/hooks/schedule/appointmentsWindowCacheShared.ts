/** Shared delay before flushing drag-queued appointment window subscriptions. */
export const APPOINTMENTS_CACHE_LOADER_DELAY_MS = 200;

/** Columns that refresh schedule appointment window caches. */
export const APPOINTMENT_WINDOW_OBSERVE_COLUMNS = [
  "patient_id",
  "type_id",
  "location_id",
  "subject",
  "status",
  "description",
  "start_time",
  "end_time",
] as const;
