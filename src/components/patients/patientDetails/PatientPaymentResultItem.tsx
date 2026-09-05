import { memo } from "react";
import { View } from "react-native";

import { ThemedIcon, ThemedText, type ThemedIconProps } from "@/components/ui";
import { balanceIcon, notesIcon } from "@/constants";
import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import type { PatientPaymentItem } from "@/hooks/usePatientPayments";
import { useNativeColors } from "@/theme";
import { primitives } from "@/tokens";

export type PatientPaymentResultItemProps = {
  item: PatientPaymentItem;
};

function formatPaymentAmount(item: PatientPaymentItem): string {
  const prefix = item.currency?.trim() || "$";
  return `${prefix} ${Math.abs(item.amount).toFixed(2)}`;
}

function MetricColumn({
  icon,
  label,
  value,
  align = "left",
}: {
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <View
      className={
        align === "right"
          ? "min-w-[72px] items-end gap-0.5"
          : "min-w-[72px] gap-0.5"
      }
    >
      <View className="flex-row items-center gap-1">
        <ThemedIcon dimension={16} name={icon} tone="muted" />
        <ThemedText className="text-xs" tone="muted" variant="label">
          {label}
        </ThemedText>
      </View>
      <ThemedText
        align={align === "right" ? "right" : "left"}
        className="font-normal capitalize"
        numberOfLines={1}
        tone="default"
        variant="label"
      >
        {value}
      </ThemedText>
    </View>
  );
}

function PatientPaymentResultItemComponent({
  item,
}: PatientPaymentResultItemProps) {
  const native = useNativeColors();
  const railColor = native.border.strong;
  const amountLabel = formatPaymentAmount(item);
  const methodLabel = item.method?.trim() || "—";
  const typeLabel = item.type?.trim() || "—";

  return (
    <View
      accessibilityLabel={`Payment, ${amountLabel}, method ${methodLabel}, type ${typeLabel}`}
      className="flex-row items-stretch gap-stack overflow-hidden py-stack pl-inline"
    >
      <View
        style={{
          width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
          borderRadius: primitives.radius.xs,
          backgroundColor: railColor,
        }}
      />

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
          <MetricColumn icon={balanceIcon} label="Method" value={methodLabel} />
          <MetricColumn
            align="right"
            icon={notesIcon}
            label="Type"
            value={typeLabel}
          />
        </View>
      </View>
    </View>
  );
}

export const PatientPaymentResultItem = memo(PatientPaymentResultItemComponent);
