import { useRouter, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui";

import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { formatTimeRange } from "@/helpers/ui/timeFormat";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { useNativeColors } from "@/theme";
import { primitives } from "@/tokens";
import type { MonthDayEventPreview } from "@/types/schedule";

export type AppointmentSearchResultItemProps = {
  event: MonthDayEventPreview;
  query?: string;
};

type SubjectTextPart = {
  value: string;
  highlighted: boolean;
};

function splitSubjectByQuery(text: string, query: string): SubjectTextPart[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [{ value: text, highlighted: false }];
  }

  const parts: SubjectTextPart[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = normalizedQuery.toLowerCase();
  let startIndex = 0;
  let matchIndex = lowerText.indexOf(lowerQuery, startIndex);

  while (matchIndex !== -1) {
    if (matchIndex > startIndex) {
      parts.push({
        value: text.slice(startIndex, matchIndex),
        highlighted: false,
      });
    }

    parts.push({
      value: text.slice(matchIndex, matchIndex + normalizedQuery.length),
      highlighted: true,
    });

    startIndex = matchIndex + normalizedQuery.length;
    matchIndex = lowerText.indexOf(lowerQuery, startIndex);
  }

  if (startIndex < text.length) {
    parts.push({ value: text.slice(startIndex), highlighted: false });
  }

  return parts.length > 0 ? parts : [{ value: text, highlighted: false }];
}

function AppointmentSearchResultItemComponent({
  event,
  query = "",
}: AppointmentSearchResultItemProps) {
  const native = useNativeColors();
  const hourFormat = useHourFormat();
  const router = useRouter();
  const timeRange = formatTimeRange(event.startTime, event.endTime, hourFormat);
  const railColor = event.color ?? native.border.strong;
  const subjectParts = useMemo(
    () => splitSubjectByQuery(event.title, query),
    [event.title, query],
  );

  return (
    <Button
      accessibilityLabel={`${event.title}${event.typeName ? ` - ${event.typeName}` : ""}, ${timeRange}`}
      className="flex-row items-stretch gap-stack-compact overflow-hidden py-stack pl-inline"
      onPress={() => router.push(`/appointments/${event.id}` as Href)}
      ripple={false}
      size="none"
      tone="neutral"
      variant="ghost"
    >
      <View
        style={{
          width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
          borderRadius: primitives.radius.xs,
          backgroundColor: railColor,
        }}
      />
      <View className="min-w-0 flex-1 justify-center">
        <Text
          className="text-sm font-semibold"
          numberOfLines={1}
          style={{ lineHeight: primitives.lineHeight.sm }}
        >
          {subjectParts.map((part, index) => (
            <Text
              key={`${part.value}-${index}`}
              className={
                part.highlighted
                  ? "font-bold text-brand-default"
                  : "text-foreground-default"
              }
            >
              {part.value}
            </Text>
          ))}
          {event.typeName ? (
            <Text className="text-foreground-default"> - </Text>
          ) : null}
          {event.typeName ? (
            <Text
              className={event.color ? undefined : "text-foreground-muted"}
              style={event.color ? { color: event.color } : undefined}
            >
              {event.typeName}
            </Text>
          ) : null}
        </Text>
        <Text
          className="mt-0.5 text-xs font-normal text-foreground-muted"
          numberOfLines={1}
          style={{ lineHeight: primitives.lineHeight.xs }}
        >
          {timeRange}
        </Text>
      </View>
    </Button>
  );
}

export const AppointmentSearchResultItem = memo(
  AppointmentSearchResultItemComponent,
);
