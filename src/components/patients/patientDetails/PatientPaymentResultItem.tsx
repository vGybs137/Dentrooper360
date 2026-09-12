import { memo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["common", "a11y"]);
  const native = useNativeColors();
  const railColor = native.border.strong;
  const amountLabel = formatMoneyAmount(item.amount, item.currency);
  const methodLabel = item.method?.trim() || t("common:empty.emDash");
  const typeLabel = item.type?.trim() || t("common:empty.emDash");

  return (
    <View
      accessibilityLabel={t("a11y:paymentDetailItem", {
        amount: amountLabel,
        method: methodLabel,
        type: typeLabel,
      })}
      className="flex-row items-stretch gap-stack overflow-hidden py-stack ps-inline"
    >
      <EventRail color={railColor} />

      <View className="min-w-0 flex-1 justify-center gap-inset-compact pe-inline">
        <View className="min-w-0 flex-row items-center gap-1.5">
          <ThemedText
            className="min-w-0 flex-1 shrink font-semibold"
            numberOfLines={1}
            variant="body"
          >
            {t("common:labels.payment")}
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
            label={t("common:labels.method")}
            value={methodLabel}
          />
          <MetricColumn
            align="end"
            icon={notesIcon}
            iconSize={16}
            label={t("common:labels.type")}
            value={typeLabel}
          />
        </View>
      </View>
    </View>
  );
}

export const PatientPaymentResultItem = memo(PatientPaymentResultItemComponent);
