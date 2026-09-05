import dayjs from "dayjs";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";

import {
  Button,
  ThemedIcon,
  ThemedText,
  type ThemedIconProps,
} from "@/components/ui";
import { calendarIcon, clockIcon, notesIcon } from "@/constants";
import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { formatPatientPhone } from "@/helpers/patientDisplay";
import {
  classifyRecallDueDate,
  getRecallDueBounds,
  type RecallDueBucket,
} from "@/helpers/recallKpis";
import { splitTextBySearchQuery } from "@/helpers/searchHighlight";
import type { ProviderRecallItem } from "@/hooks/useProviderRecalls";
import { useWeekStartsOn } from "@/stores/schedulePreferencesStore";
import { useNativeColors } from "@/theme";
import { primitives } from "@/tokens";

export type RecallListItemProps = {
  item: ProviderRecallItem;
  onPress?: () => void;
  searchQuery?: string;
};

const RAIL_BY_BUCKET: Record<RecallDueBucket, string> = {
  overdue: "#EF4444",
  dueToday: "#F97316",
  dueThisWeek: "#3B82F6",
  later: "#94A3B8",
};

function formatDueDate(date: Date): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return dayjs(date).format("D MMM, YYYY");
}

function dueStatusLabel(bucket: RecallDueBucket | null): string {
  switch (bucket) {
    case "overdue":
      return "Overdue";
    case "dueToday":
      return "Due today";
    case "dueThisWeek":
      return "This week";
    case "later":
      return "Upcoming";
    default:
      return "—";
  }
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
        className="font-normal"
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

function RecallListItemComponent({
  item,
  onPress,
  searchQuery,
}: RecallListItemProps) {
  const native = useNativeColors();
  const weekStartsOn = useWeekStartsOn();
  const bounds = useMemo(
    () => getRecallDueBounds(dayjs(), weekStartsOn),
    [weekStartsOn],
  );
  const bucket = classifyRecallDueDate(item.dueDate, bounds);
  const railColor = bucket
    ? RAIL_BY_BUCKET[bucket]
    : native.border.strong;
  const dueLabel = formatDueDate(item.dueDate);
  const statusLabel = dueStatusLabel(bucket);
  const phone =
    formatPatientPhone(item.countryCode, item.phoneNumber) ?? "No phone";

  const content = (
    <View
      accessibilityLabel={`Recall for ${item.patientName}, ${item.serviceName}, due ${dueLabel}, ${statusLabel}`}
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
            tone={bucket === "overdue" ? "alert" : "default"}
            variant="label"
          >
            {statusLabel}
          </ThemedText>
        </View>

        <View className="flex-row items-start justify-between">
          <MetricColumn icon={calendarIcon} label="Due" value={dueLabel} />
          <MetricColumn
            align="center"
            icon={notesIcon}
            label="Service"
            value={item.serviceName}
          />
          <MetricColumn
            align="right"
            icon={clockIcon}
            label="Interval"
            value={`${item.interval}`}
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

export const RecallListItem = memo(RecallListItemComponent);
