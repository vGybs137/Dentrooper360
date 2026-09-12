import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/react";

import type Service from "@/database/models/Service";
import { pickLocalizedName } from "@/helpers/i18n/pickLocalizedName";
import { useObservedQuery } from "@/hooks/data/useObservedQuery";
import { t } from "@/i18n";
import { useAuthUser } from "@/stores/authStore";
import { useResolvedLocale } from "@/stores";

const SERVICE_COLUMNS = [
  "name_en",
  "name_ar",
  "name_fr",
  "date",
  "fee",
  "status",
  "color",
  "code",
  "note",
  "is_posted",
  "posted_date",
] as const;

const EMPTY_SERVICES: PatientServiceItem[] = [];

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

export function usePatientServices(
  patientId: string | undefined,
): UsePatientServicesResult {
  const database = useDatabase();
  const locale = useResolvedLocale();
  const providerId = useAuthUser()?.id ?? null;
  const enabled = Boolean(patientId && providerId);

  const { data, isLoading, error } = useObservedQuery<
    Service,
    PatientServiceItem[]
  >({
    enabled,
    deps: [patientId, providerId, locale],
    columns: SERVICE_COLUMNS,
    emptyData: EMPTY_SERVICES,
    getQuery: () =>
      database.get<Service>("services").query(
        Q.where("patient_id", patientId!),
        Q.where("provider_id", providerId!),
        Q.sortBy("date", Q.desc),
      ),
    mapRecords: (records) =>
      records.map((record) => ({
        id: record.id,
        name:
          pickLocalizedName(record, locale) ||
          record.code?.trim() ||
          t("patients:service.fallbackName"),
        date: record.date,
        fee: record.fee,
        status: record.status,
        color: record.color ?? record.statusColor ?? null,
        code: record.code,
        note: record.note,
        isPosted: record.isPosted,
        postedDate: record.postedDate,
      })),
  });

  return { services: data, isLoading, error };
}
