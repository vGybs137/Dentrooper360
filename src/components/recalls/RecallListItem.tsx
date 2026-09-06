import dayjs from "dayjs";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";

import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import { notesIcon } from "@/constants";
import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { withOpacity } from "@/helpers/color";
import { formatPatientPhone } from "@/helpers/patientDisplay";
import {
  classifyRecallDueDate,
  getRecallDueBounds,
  hasRecallAppointment,
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

const DONE_PILL = { accent: "#0A9E91", textTone: "success" as const };

const PILL_BY_BUCKET: Record<
  RecallDueBucket,
  { accent: string; textTone: "alert" | "default" | "muted" | "success" }
> = {
  overdue: { accent: "#EF4444", textTone: "alert" },
  dueToday: { accent: "#F97316", textTone: "default" },
  dueThisWeek: { accent: "#3B82F6", textTone: "default" },
  later: { accent: "#94A3B8", textTone: "muted" },
};

/** Whole calendar days from today to due date (negative when overdue). */
function daysUntilDue(dueDate: Date): number | null {
  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return null;
  }

  return dayjs(dueDate).startOf("day").diff(dayjs().startOf("day"), "day");
}

function formatDueInPill(dueDate: Date, isDone: boolean): string {
  const days = daysUntilDue(dueDate);

  if (isDone) {
    if (days == null) {
      return "Done";
    }

    if (days < 0) {
      const ago = Math.abs(days);
      return ago === 1 ? "Done 1 day ago" : `Done ${ago} days ago`;
    }

    if (days === 0) {
      return "Done today";
    }

    return "Done";
  }

  if (days == null) {
    return "—";
  }

  if (days < 0) {
    const ago = Math.abs(days);
    return ago === 1 ? "Due 1 day ago" : `Due ${ago} days ago`;
  }

  if (days === 0) {
    return "Due today";
  }

  return days === 1 ? "Due in 1 day" : `Due in ${days} days`;
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

function DueInPill({
  bucket,
  dueDate,
  isDone,
}: {
  bucket: RecallDueBucket | null;
  dueDate: Date;
  isDone: boolean;
}) {
  const theme = isDone
    ? DONE_PILL
    : bucket
      ? PILL_BY_BUCKET[bucket]
      : PILL_BY_BUCKET.later;
  const label = formatDueInPill(dueDate, isDone);

  return (
    <View
      className="rounded-pill px-2 py-0.5"
      style={{ backgroundColor: withOpacity(theme.accent, 0.2) }}
    >
      <ThemedText
        className="text-[11px] font-semibold"
        tone={theme.textTone}
        variant="label"
      >
        {label}
      </ThemedText>
    </View>
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
  const isDone = hasRecallAppointment(item.appointmentId);
  const bucket = classifyRecallDueDate(
    item.dueDate,
    bounds,
    item.appointmentId,
  );
  const railColor = isDone
    ? DONE_PILL.accent
    : bucket
      ? RAIL_BY_BUCKET[bucket]
      : native.border.strong;
  const duePillLabel = formatDueInPill(item.dueDate, isDone);
  const phone =
    formatPatientPhone(item.countryCode, item.phoneNumber) ?? "No phone";

  const content = (
    <View
      accessibilityLabel={`Recall for ${item.patientName}, ${phone}, ${item.serviceName}, ${duePillLabel}`}
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
        <View className="min-w-0 flex-row items-center gap-2">
          <HighlightedText
            className="min-w-0 shrink font-semibold"
            numberOfLines={1}
            searchQuery={searchQuery}
            text={item.patientName}
          />
          <HighlightedText
            className="min-w-0 shrink"
            numberOfLines={1}
            searchQuery={searchQuery}
            text={phone}
            tone="muted"
            toneClassName="text-foreground-muted"
            variant="label"
          />
        </View>

        <View className="min-w-0 flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 shrink items-start gap-0.5">
            <View className="flex-row items-center gap-1">
              <ThemedIcon dimension={16} name={notesIcon} tone="muted" />
              <ThemedText className="text-xs" tone="muted" variant="label">
                Service
              </ThemedText>
            </View>
            <HighlightedText
              className="max-w-full font-normal"
              numberOfLines={1}
              searchQuery={searchQuery}
              text={item.serviceName}
              variant="label"
            />
          </View>

          <DueInPill
            bucket={bucket}
            dueDate={item.dueDate}
            isDone={isDone}
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
