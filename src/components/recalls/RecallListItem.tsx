import dayjs from "dayjs";
import { memo, useMemo } from "react";
import { View } from "react-native";

import {
  Button,
  EventRail,
  SearchHighlightText,
  ThemedIcon,
  ThemedText,
} from "@/components/ui";
import {
  accentBlue,
  accentOrange,
  accentRed,
  accentSlate,
  accentTeal,
  notesIcon,
} from "@/constants";
import { withOpacity } from "@/helpers/ui/color";
import { formatPatientPhone } from "@/helpers/patients/patientDisplay";
import { daysFromToday } from "@/helpers/recalls/recallDisplay";
import {
  classifyRecallDueDate,
  getRecallDueBounds,
  hasRecallAppointment,
  type RecallDueBucket,
} from "@/helpers/recalls/recallKpis";
import type { ProviderRecallItem } from "@/hooks/recalls/useProviderRecalls";
import { useWeekStartsOn } from "@/stores/schedulePreferencesStore";
import { useNativeColors } from "@/theme";

export type RecallListItemProps = {
  item: ProviderRecallItem;
  onPress?: () => void;
  searchQuery?: string;
};

const RAIL_BY_BUCKET: Record<RecallDueBucket, string> = {
  overdue: accentRed,
  dueToday: accentOrange,
  dueThisWeek: accentBlue,
  later: accentSlate,
};

const DONE_PILL = { accent: accentTeal, textTone: "success" as const };

const PILL_BY_BUCKET: Record<
  RecallDueBucket,
  { accent: string; textTone: "alert" | "default" | "muted" | "success" }
> = {
  overdue: { accent: accentRed, textTone: "alert" },
  dueToday: { accent: accentOrange, textTone: "default" },
  dueThisWeek: { accent: accentBlue, textTone: "default" },
  later: { accent: accentSlate, textTone: "muted" },
};

function formatRelativeDayLabel(
  days: number,
  pastSingular: string,
  pastPlural: (n: number) => string,
  todayLabel: string,
  futureSingular: string,
  futurePlural: (n: number) => string,
): string {
  if (days < 0) {
    const ago = Math.abs(days);
    return ago === 1 ? pastSingular : pastPlural(ago);
  }

  if (days === 0) {
    return todayLabel;
  }

  return days === 1 ? futureSingular : futurePlural(days);
}

function formatDueInPill(
  dueDate: Date,
  isDone: boolean,
  appointmentStartTime: Date | null,
): string {
  if (isCompletedRecall(isDone, appointmentStartTime, dueDate)) {
    const doneDays = daysFromToday(appointmentStartTime ?? dueDate);
    if (doneDays != null) {
      return formatRelativeDayLabel(
        doneDays,
        "Done 1 day ago",
        (n) => `Done ${n} days ago`,
        "Done today",
        "Due in 1 day",
        (n) => `Due in ${n} days`,
      );
    }
  }

  const days = daysFromToday(dueDate);
  if (days == null) {
    return "—";
  }

  return formatRelativeDayLabel(
    days,
    "Due 1 day ago",
    (n) => `Due ${n} days ago`,
    "Due today",
    "Due in 1 day",
    (n) => `Due in ${n} days`,
  );
}

/** Appointment linked and its day is today or earlier. */
function isCompletedRecall(
  hasAppointment: boolean,
  appointmentStartTime: Date | null,
  dueDate: Date,
): boolean {
  if (!hasAppointment) {
    return false;
  }

  const doneDays = daysFromToday(appointmentStartTime ?? dueDate);
  return doneDays != null && doneDays <= 0;
}

function DueInPill({
  appointmentStartTime,
  bucket,
  dueDate,
  isDone,
}: {
  appointmentStartTime: Date | null;
  bucket: RecallDueBucket | null;
  dueDate: Date;
  isDone: boolean;
}) {
  const showDone = isCompletedRecall(isDone, appointmentStartTime, dueDate);
  const theme = showDone
    ? DONE_PILL
    : bucket
      ? PILL_BY_BUCKET[bucket]
      : PILL_BY_BUCKET.later;
  const label = formatDueInPill(dueDate, isDone, appointmentStartTime);

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
  const showDone = isCompletedRecall(
    isDone,
    item.appointmentStartTime,
    item.dueDate,
  );
  const bucket = classifyRecallDueDate(
    item.dueDate,
    bounds,
    item.appointmentId,
  );
  const railColor = showDone
    ? DONE_PILL.accent
    : bucket
      ? RAIL_BY_BUCKET[bucket]
      : native.border.strong;
  const duePillLabel = formatDueInPill(
    item.dueDate,
    isDone,
    item.appointmentStartTime,
  );
  const phone =
    formatPatientPhone(item.countryCode, item.phoneNumber) ?? "No phone";

  const content = (
    <View
      accessibilityLabel={`Recall for ${item.patientName}, ${phone}, ${item.serviceName}, ${duePillLabel}`}
      className="flex-row items-stretch gap-stack overflow-hidden rounded-card border border-border-subtle bg-surface-sunken py-stack pl-inline"
    >
      <EventRail color={railColor} />

      <View className="min-w-0 flex-1 justify-center gap-inset-compact pr-inline">
        <View className="min-w-0 flex-row items-center gap-2">
          <SearchHighlightText
            className="min-w-0 shrink font-semibold"
            numberOfLines={1}
            searchQuery={searchQuery}
            text={item.patientName}
          />
          <SearchHighlightText
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
            <SearchHighlightText
              className="max-w-full font-normal"
              numberOfLines={1}
              searchQuery={searchQuery}
              text={item.serviceName}
              variant="label"
            />
          </View>

          <DueInPill
            appointmentStartTime={item.appointmentStartTime}
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
