import { Q } from "@nozbe/watermelondb";
import { useDatabase } from "@nozbe/watermelondb/react";

import type Payment from "@/database/models/Payment";
import {
  formatPatientName,
  patientMatchesSearch,
} from "@/helpers/patients/patientDisplay";
import { useObservedQuery } from "@/hooks/data/useObservedQuery";
import { useAuthUser } from "@/stores/authStore";

const PAYMENT_COLUMNS = [
  "patient_id",
  "amount",
  "currency",
  "date",
  "type",
  "method",
  "description",
  "is_active",
] as const;

const EMPTY_PAYMENTS: ProviderPaymentItem[] = [];

export type ProviderPaymentItem = {
  id: string;
  amount: number;
  currency: string;
  date: Date;
  type: string;
  method: string;
  description: string | null;
  patientId: string;
  patientName: string;
  countryCode: string | null;
  phoneNumber: string | null;
};

export type UseProviderPaymentsResult = {
  payments: ProviderPaymentItem[];
  isLoading: boolean;
  error: Error | null;
};

async function mapPayment(record: Payment): Promise<ProviderPaymentItem> {
  let patientId = "";
  let patientName = "Unknown patient";
  let countryCode: string | null = null;
  let phoneNumber: string | null = null;

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

  return {
    id: record.id,
    amount: record.amount,
    currency: record.currency,
    date: record.date,
    type: record.type,
    method: record.method,
    description: record.description?.trim() || null,
    patientId,
    patientName,
    countryCode,
    phoneNumber,
  };
}

export function useProviderPayments(
  { enabled = true }: { enabled?: boolean } = {},
): UseProviderPaymentsResult {
  const database = useDatabase();
  const providerId = useAuthUser()?.id ?? null;
  const isEnabled = Boolean(enabled && providerId);

  const { data, isLoading, error } = useObservedQuery<
    Payment,
    ProviderPaymentItem[]
  >({
    enabled: isEnabled,
    deps: [enabled, providerId],
    columns: PAYMENT_COLUMNS,
    emptyData: EMPTY_PAYMENTS,
    getQuery: () =>
      database.get<Payment>("payments").query(
        Q.where("provider_id", providerId!),
        Q.where("is_active", true),
        Q.sortBy("date", Q.desc),
      ),
    mapRecords: (records) => Promise.all(records.map(mapPayment)),
  });

  return { payments: data, isLoading, error };
}

/** Filter provider payments by patient name or phone. */
export function filterProviderPayments(
  payments: readonly ProviderPaymentItem[],
  search: string,
): ProviderPaymentItem[] {
  const query = search.trim();
  if (!query) {
    return [...payments];
  }

  return payments.filter((payment) =>
    patientMatchesSearch(
      {
        displayName: payment.patientName,
        countryCode: payment.countryCode,
        phoneNumber: payment.phoneNumber,
      },
      query,
    ),
  );
}
