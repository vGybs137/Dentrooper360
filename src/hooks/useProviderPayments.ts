import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import database from "@/database";
import type Payment from "@/database/models/Payment";
import {
  formatPatientName,
  patientMatchesSearch,
} from "@/helpers/patientDisplay";
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
  const providerId = useAuthUser()?.id ?? null;
  const [payments, setPayments] = useState<ProviderPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(enabled && providerId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !providerId) {
      setPayments([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const subscription = database
      .get<Payment>("payments")
      .query(
        Q.where("provider_id", providerId),
        Q.where("is_active", true),
        Q.sortBy("date", Q.desc),
      )
      .observeWithColumns([...PAYMENT_COLUMNS])
      .subscribe({
        next: (records) => {
          void Promise.all(records.map(mapPayment)).then((mapped) => {
            if (cancelled) {
              return;
            }

            setPayments(mapped);
            setIsLoading(false);
            setError(null);
          });
        },
        error: (err) => {
          if (cancelled) {
            return;
          }

          setPayments([]);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
        },
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [enabled, providerId]);

  return { payments, isLoading, error };
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
