import { Q } from "@nozbe/watermelondb";
import { useEffect, useState } from "react";

import database from "@/database";
import type Payment from "@/database/models/Payment";
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
  const providerId = useAuthUser()?.id ?? null;
  const [payments, setPayments] = useState<PatientPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(patientId && providerId));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientId || !providerId) {
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
        Q.where("patient_id", patientId),
        Q.where("provider_id", providerId),
        Q.where("is_active", true),
        Q.sortBy("date", Q.desc),
      )
      .observeWithColumns([...PAYMENT_COLUMNS])
      .subscribe({
        next: (records) => {
          if (cancelled) {
            return;
          }

          setPayments(records.map(mapPayment));
          setIsLoading(false);
          setError(null);
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
  }, [patientId, providerId]);

  return { payments, isLoading, error };
}
