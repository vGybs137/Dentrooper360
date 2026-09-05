import dayjs from "dayjs";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";

import {
  Button,
  ThemedIcon,
  ThemedText,
  type ThemedIconProps,
} from "@/components/ui";
import { balanceIcon, calendarIcon, notesIcon } from "@/constants";
import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { formatPatientPhone } from "@/helpers/patientDisplay";
import { splitTextBySearchQuery } from "@/helpers/searchHighlight";
import type { ProviderPaymentItem } from "@/hooks/useProviderPayments";
import { useNativeColors } from "@/theme";
import { primitives } from "@/tokens";

export type PaymentListItemProps = {
  item: ProviderPaymentItem;
  onPress?: () => void;
  searchQuery?: string;
};

function formatPaymentAmount(item: ProviderPaymentItem): string {
  const prefix = item.currency?.trim() || "$";
  return `${prefix} ${Math.abs(item.amount).toFixed(2)}`;
}

function formatPaymentDate(date: Date): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return dayjs(date).format("D MMM, YYYY");
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
  align?: "left" | "center" | "right";
}) {
  const alignClass =
    align === "right"
      ? "min-w-[72px] items-end gap-0.5"
      : align === "center"
        ? "min-w-[72px] items-center gap-0.5"
        : "min-w-[72px] gap-0.5";

  return (
    <View className={alignClass}>
      <View className="flex-row items-center gap-1">
        <ThemedIcon dimension={16} name={icon} tone="muted" />
        <ThemedText className="text-xs" tone="muted" variant="label">
          {label}
        </ThemedText>
      </View>
      <ThemedText
        align={
          align === "right" ? "right" : align === "center" ? "center" : "left"
        }
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

function HighlightedText({
  className,
  numberOfLines,
  searchQuery,
  text,
  tone = "default",
  toneClassName = "text-foreground-default",
  variant = "body",
}: {
  className?: string;
  numberOfLines?: number;
  searchQuery?: string;
  text: string;
  tone?: "default" | "muted";
  toneClassName?: string;
  variant?: "body" | "label";
}) {
  const parts = useMemo(
    () => splitTextBySearchQuery(text, searchQuery ?? ""),
    [searchQuery, text],
  );
  const hasHighlight = Boolean(searchQuery?.trim());
  const sizeClass = variant === "label" ? "text-label" : "text-body";

  if (!hasHighlight) {
    return (
      <ThemedText
        className={className}
        numberOfLines={numberOfLines}
        tone={tone}
        variant={variant}
      >
        {text}
      </ThemedText>
    );
  }

  return (
    <Text
      className={`${sizeClass} ${toneClassName}${className ? ` ${className}` : ""}`}
      numberOfLines={numberOfLines}
    >
      {parts.map((part, index) => (
        <Text
          key={`${part.value}-${index}`}
          className={
            part.highlighted
              ? "font-semibold text-brand-default"
              : toneClassName
          }
        >
          {part.value}
        </Text>
      ))}
    </Text>
  );
}

function PaymentListItemComponent({
  item,
  onPress,
  searchQuery,
}: PaymentListItemProps) {
  const native = useNativeColors();
  const railColor = native.border.strong;
  const amountLabel = formatPaymentAmount(item);
  const methodLabel = item.method?.trim() || "—";
  const typeLabel = item.type?.trim() || "—";
  const dateLabel = formatPaymentDate(item.date);
  const phone =
    formatPatientPhone(item.countryCode, item.phoneNumber) ?? "No phone";

  const content = (
    <View
      accessibilityLabel={`Payment from ${item.patientName}, ${amountLabel}, date ${dateLabel}, method ${methodLabel}, type ${typeLabel}`}
      className="flex-row items-stretch gap-stack overflow-hidden rounded-card border border-border-subtle bg-surface-sunken py-stack pl-inline"
    >
      <View
        style={{
          width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
          borderRadius: primitives.radius.xs,
          backgroundColor: railColor,
        }}
      />

      <View className="min-w-0 flex-1 justify-center gap-inset-compact pr-inline">
        <View className="min-w-0 flex-row items-start gap-1.5">
          <View className="min-w-0 flex-1 shrink gap-0.5">
            <HighlightedText
              className="min-w-0 font-semibold"
              numberOfLines={1}
              searchQuery={searchQuery}
              text={item.patientName}
            />
            <HighlightedText
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
          <MetricColumn icon={calendarIcon} label="Date" value={dateLabel} />
          <MetricColumn
            align="center"
            icon={balanceIcon}
            label="Method"
            value={methodLabel}
          />
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
