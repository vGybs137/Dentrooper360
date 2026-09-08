import { memo } from "react";
import { View } from "react-native";

import {
  Button,
  EventRail,
  MetricColumn,
  SearchHighlightText,
  ThemedText,
} from "@/components/ui";
import { balanceIcon, calendarIcon, notesIcon } from "@/constants";
import { formatMoneyAmount } from "@/helpers/payments/currency";
import { formatDisplayDate } from "@/helpers/ui/display";
import { formatPatientPhone } from "@/helpers/patients/patientDisplay";
import type { ProviderPaymentItem } from "@/hooks/payments/useProviderPayments";
import { useNativeColors } from "@/theme";

export type PaymentListItemProps = {
  item: ProviderPaymentItem;
  onPress?: () => void;
  searchQuery?: string;
};

function PaymentListItemComponent({
  item,
  onPress,
  searchQuery,
}: PaymentListItemProps) {
  const native = useNativeColors();
  const railColor = native.border.strong;
  const amountLabel = formatMoneyAmount(item.amount, item.currency);
  const methodLabel = item.method?.trim() || "—";
  const typeLabel = item.type?.trim() || "—";
  const dateLabel = formatDisplayDate(item.date, "—").value;
  const phone =
    formatPatientPhone(item.countryCode, item.phoneNumber) ?? "No phone";

  const content = (
    <View
      accessibilityLabel={`Payment from ${item.patientName}, ${amountLabel}, date ${dateLabel}, method ${methodLabel}, type ${typeLabel}`}
      className="flex-row items-stretch gap-stack overflow-hidden rounded-card border border-border-subtle bg-surface-sunken py-stack pl-inline"
    >
      <EventRail color={railColor} />

      <View className="min-w-0 flex-1 justify-center gap-inset-compact pr-inline">
        <View className="min-w-0 flex-row items-start gap-1.5">
          <View className="min-w-0 flex-1 shrink gap-0.5">
            <SearchHighlightText
              className="min-w-0 font-semibold"
              numberOfLines={1}
              searchQuery={searchQuery}
              text={item.patientName}
            />
            <SearchHighlightText
              numberOfLines={1}
              searchQuery={searchQuery}
              text={phone}
              tone="muted"
              toneClassName="text-foreground-muted"
              variant="label"
            />
          </View>
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
            icon={calendarIcon}
            iconSize={16}
            label="Date"
            value={dateLabel}
          />
          <MetricColumn
            align="center"
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

  if (!onPress) {
    return content;
  }

  return (
    <Button
      accessibilityRole="button"
      onPress={onPress}
      ripple={false}
      size="none"
      style={({ pressed }) => (pressed ? { opacity: 0.92 } : undefined)}
      tone="neutral"
      variant="ghost"
    >
      {content}
    </Button>
  );
}

export const PaymentListItem = memo(PaymentListItemComponent);
