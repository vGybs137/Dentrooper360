import { memo } from "react";
import { View } from "react-native";

import { EventRail, MetricColumn, ThemedText } from "@/components/ui";
import { balanceIcon, notesIcon } from "@/constants";
import { formatMoneyAmount } from "@/helpers/payments/currency";
import type { PatientPaymentItem } from "@/hooks/patients/usePatientPayments";
import { useNativeColors } from "@/theme";

export type PatientPaymentResultItemProps = {
  item: PatientPaymentItem;
};

function PatientPaymentResultItemComponent({
  item,
}: PatientPaymentResultItemProps) {
  const native = useNativeColors();
  const railColor = native.border.strong;
  const amountLabel = formatMoneyAmount(item.amount, item.currency);
  const methodLabel = item.method?.trim() || "—";
  const typeLabel = item.type?.trim() || "—";

  return (
    <View
      accessibilityLabel={`Payment, ${amountLabel}, method ${methodLabel}, type ${typeLabel}`}
      className="flex-row items-stretch gap-stack overflow-hidden py-stack pl-inline"
    >
      <EventRail color={railColor} />

      <View className="min-w-0 flex-1 justify-center gap-inset-compact pr-inline">
        <View className="min-w-0 flex-row items-center gap-1.5">
          <ThemedText
            className="min-w-0 flex-1 shrink font-semibold"
            numberOfLines={1}
            variant="body"
          >
            Payment
          </ThemedText>
          <ThemedText
            className="shrink-0 font-semibold"
            numberOfLines={1}
            variant="body"
          >
            {amountLabel}
          </ThemedText>
        </View>

        <View className="flex-row items-start justify-between">
          <MetricColumn
            icon={balanceIcon}
            iconSize={16}
            label="Method"
            value={methodLabel}
          />
          <MetricColumn
            align="right"
            icon={notesIcon}
            iconSize={16}
            label="Type"
            value={typeLabel}
          />
        </View>
      </View>
    </View>
  );
}

export const PatientPaymentResultItem = memo(PatientPaymentResultItemComponent);
