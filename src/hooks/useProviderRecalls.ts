import { Q } from "@nozbe/watermelondb";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import database from "@/database";
import type Recall from "@/database/models/Recall";
import {
  formatPatientName,
  patientMatchesSearch,
} from "@/helpers/patientDisplay";
import {
  compareRecallsByUrgency,
  computeRecallListKpis,
  EMPTY_RECALL_LIST_KPIS,
  getRecallDueBounds,
  type RecallListKpis,
} from "@/helpers/recallKpis";
import { useAuthUser } from "@/stores/authStore";
import { useWeekStartsOn } from "@/stores/schedulePreferencesStore";

const RECALL_COLUMNS = [
  "patient_id",
  "appointment_id",
  "service_code",
  "service_name_en",
  "service_name_ar",
  "service_name_fr",
  "interval",
  "reminder_interval",
  "date",
  "due_date",
  "note",
  "is_active",
] as const;

export type ProviderRecallItem = {
  id: string;
  patientId: string;
  patientName: string;
  countryCode: string | null;
  phoneNumber: string | null;
  appointmentId: string | null;
  /** Linked appointment start; used for "Done N days ago". */
  appointmentStartTime: Date | null;
  serviceCode: string | null;
  serviceName: string;
  interval: number;
  reminderInterval: number;
  date: Date;
  dueDate: Date;
  note: string | null;
};

export type UseProviderRecallsResult = {
  recalls: ProviderRecallItem[];
  kpis: RecallListKpis;
  isLoading: boolean;
  error: Error | null;
};

async function mapRecall(record: Recall): Promise<ProviderRecallItem> {
  let patientId = "";
  let patientName = "Unknown patient";
  let countryCode: string | null = null;
  let phoneNumber: string | null = null;
  let appointmentStartTime: Date | null = null;

  try {
    const patient = await record.patient.fetch();
    patientId = patient.id;
    patientName = formatPatientName(patient) || "Unnamed patient";
    countryCode = patient.countryCode?.trim() || null;
    phoneNumber = patient.phoneNumber?.trim() || null;
  } catch {
    const rawPatientId = (record._raw as { patient_id?: string }).patient_id;
    patientId = rawPatientId ?? "";
  }

  const appointmentId = record.appointmentId?.trim() || null;
  if (appointmentId) {
    try {
      const appointment = await record.appointment.fetch();
      appointmentStartTime = appointment.startTime ?? null;
    } catch {
      appointmentStartTime = null;
    }
  }

  return {
    id: record.id,
    patientId,
    patientName,
    countryCode,
    phoneNumber,
    appointmentId,
    appointmentStartTime,
    serviceCode: record.serviceCode,
    serviceName: record.serviceNameEn?.trim() || "Service",
    interval: record.interval,
    reminderInterval: record.reminderInterval,
    date: record.date,
    dueDate: record.dueDate,
    note: record.note?.trim() || null,
  };
}

export function useProviderRecalls(
  { enabled = true }: { enabled?: boolean } = {},
): UseProviderRecallsResult {
  const providerId = useAuthUser()?.id ?? null;
  const weekStartsOn = useWeekStartsOn();
  const [recalls, setRecalls] = useState<ProviderRecallItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && providerId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !providerId) {
      setRecalls([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const subscription = database
      .get<Recall>("recalls")
      .query(
        Q.where("provider_id", providerId),
        Q.where("is_active", true),
        Q.sortBy("due_date", Q.asc),
      )
      .observeWithColumns([...RECALL_COLUMNS])
      .subscribe({
        next: (records) => {
          void Promise.all(records.map(mapRecall)).then((mapped) => {
            if (cancelled) {
              return;
            }

            setRecalls(mapped);
            setIsLoading(false);
            setError(null);
          });
        },
        error: (err) => {
          if (cancelled) {
            return;
          }

          setRecalls([]);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [enabled, providerId]);

  const sortedRecalls = useMemo(() => {
    const bounds = getRecallDueBounds(dayjs(), weekStartsOn);
    return [...recalls].sort((a, b) => compareRecallsByUrgency(a, b, bounds));
  }, [recalls, weekStartsOn]);

  const kpis = useMemo(
    () => computeRecallListKpis(sortedRecalls, dayjs(), weekStartsOn),
    [sortedRecalls, weekStartsOn],
  );

  return {
    recalls: sortedRecalls,
    kpis: enabled && providerId ? kpis : EMPTY_RECALL_LIST_KPIS,
    isLoading,
    error,
  };
}

/** Filter provider recalls by patient name, phone, or service. */
export function filterProviderRecalls(
  recalls: readonly ProviderRecallItem[],
  search: string,
): ProviderRecallItem[] {
  const query = search.trim();
  if (!query) {
    return [...recalls];
  }

  const lowerQuery = query.toLowerCase();

  return recalls.filter((recall) => {
    if (
      patientMatchesSearch(
        {
          displayName: recall.patientName,
          countryCode: recall.countryCode,
          phoneNumber: recall.phoneNumber,
        },
        query,
      )
    ) {
      return true;
    }

    return recall.serviceName.toLowerCase().includes(lowerQuery);
  });
}
