import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/react";

import type Payment from "@/database/models/Payment";
import { useObservedQuery } from "@/hooks/data/useObservedQuery";
import { useAuthUser } from "@/stores/authStore";

const PAYMENT_COLUMNS = [
  "amount",
  "currency",
  "date",
  "type",
  "method",
  "description",
  "is_active",
] as const;

const EMPTY_PAYMENTS: PatientPaymentItem[] = [];

export type PatientPaymentItem = {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  type: string;
  method: string;
  description: string | null;
};

export type UsePatientPaymentsResult = {
  payments: PatientPaymentItem[];
  isLoading: boolean;
  error: Error | null;
};

function mapPayment(record: Payment): PatientPaymentItem {
  return {
    id: record.id,
    amount: record.amount,
    currency: record.currency,
    date: record.date,
    type: record.type,
    method: record.method,
    description: record.description?.trim() || null,
  };
}

export function usePatientPayments(
  patientId: string | undefined,
): UsePatientPaymentsResult {
  const database = useDatabase();
  const providerId = useAuthUser()?.id ?? null;
  const enabled = Boolean(patientId && providerId);

  const { data, isLoading, error } = useObservedQuery<
    Payment,
    PatientPaymentItem[]
  >({
    enabled,
    deps: [patientId, providerId],
    columns: PAYMENT_COLUMNS,
    emptyData: EMPTY_PAYMENTS,
    getQuery: () =>
      database.get<Payment>("payments").query(
        Q.where("patient_id", patientId!),
        Q.where("provider_id", providerId!),
        Q.where("is_active", true),
        Q.sortBy("date", Q.desc),
      ),
    mapRecords: (records) => records.map(mapPayment),
  });

  return { payments: data, isLoading, error };
}
