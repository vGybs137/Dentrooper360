import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import database from "@/database";
import type Service from "@/database/models/Service";
import { useAuthUser } from "@/stores/authStore";

const SERVICE_COLUMNS = [
  "name_en",
  "date",
  "fee",
  "status",
  "color",
  "code",
  "note",
  "is_posted",
  "posted_date",
] as const;

export type PatientServiceItem = {
  id: string;
  name: string;
  date: Date;
  fee: number;
  status: string;
  color: string | null;
  code: string | null;
  note: string | null;
  isPosted: boolean;
  postedDate: Date | null;
};

export type UsePatientServicesResult = {
  services: PatientServiceItem[];
  isLoading: boolean;
  error: Error | null;
};

function mapService(record: Service): PatientServiceItem {
  return {
    id: record.id,
    name: record.nameEn?.trim() || record.code?.trim() || "Service",
    date: record.date,
    fee: record.fee,
    status: record.status,
    color: record.color ?? record.statusColor ?? null,
    code: record.code,
    note: record.note,
    isPosted: record.isPosted,
    postedDate: record.postedDate,
  };
}

export function usePatientServices(
  patientId: string | undefined,
): UsePatientServicesResult {
  const providerId = useAuthUser()?.id ?? null;
  const [services, setServices] = useState<PatientServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(patientId && providerId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId || !providerId) {
      setServices([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const subscription = database
      .get<Service>("services")
      .query(
        Q.where("patient_id", patientId),
        Q.where("provider_id", providerId),
        Q.sortBy("date", Q.desc),
      )
      .observeWithColumns([...SERVICE_COLUMNS])
      .subscribe({
        next: (records) => {
          if (cancelled) {
            return;
          }

          setServices(records.map(mapService));
          setIsLoading(false);
          setError(null);
        },
        error: (err) => {
          if (cancelled) {
            return;
          }

          setServices([]);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [patientId, providerId]);

  return { services, isLoading, error };
}
