import { useRouter, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Text, View } from "react-native";

import { Button } from "@/components/ui";

import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { formatTimeRange } from "@/helpers/timeFormat";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { useNativeColors } from "@/theme";
import { primitives, semantic } from "@/tokens";
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
  const typeColor = event.color ?? native.border.strong;
  const subjectParts = useMemo(
    () => splitSubjectByQuery(event.title, query),
    [event.title, query],
  );

  const rowStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "stretch" as const,
      overflow: "hidden" as const,
      paddingVertical: semantic.space.stack.compact,
      gap: semantic.space.stack.compact,
    }),
    [],
  );

  const railStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
      borderRadius: primitives.radius.xs,
      backgroundColor: typeColor,
    }),
    [ typeColor],
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: primitives.fontSize.sm,
      lineHeight: primitives.lineHeight.sm,
      fontWeight: primitives.fontWeight.semibold,
    }),
    [],
  );

  const metaStyle = useMemo(
    () => ({
      marginTop: primitives.space[2],
      color: native.foreground.muted,
      fontSize: primitives.fontSize.xs,
      lineHeight: primitives.lineHeight.xs,
      fontWeight: primitives.fontWeight.regular,
    }),
    [native],
  );

  const highlightStyle = useMemo(
    () => ({
      color: native.brand.default,
      fontWeight: primitives.fontWeight.bold as "700",
    }),
    [native],
  );

  const subjectStyle = useMemo(
    () => ({
      color: native.foreground.default,
    }),
    [native],
  );

  return (
    <Button
      accessibilityLabel={`${event.title}${event.typeName ? ` - ${event.typeName}` : ""}, ${timeRange}`}
      onPress={() => router.push(`/appointments/${event.id}` as Href)}
      ripple={false}
      size="none"
      style={rowStyle}
      tone="neutral"
      variant="ghost"
    >
      <View style={railStyle} />
      <View className="min-w-0 flex-1 justify-center">
        <Text numberOfLines={1} style={titleStyle}>
          {subjectParts.map((part, index) => (
            <Text
              key={`${part.value}-${index}`}
              style={part.highlighted ? highlightStyle : subjectStyle}
            >
              {part.value}
            </Text>
          ))}
          {event.typeName ? (
            <Text style={{ color: native.foreground.default }}> - </Text>
          ) : null}
          {event.typeName ? (
            <Text style={{ color: typeColor }}>{event.typeName}</Text>
          ) : null}
        </Text>
        <Text numberOfLines={1} style={metaStyle}>
          {timeRange}
        </Text>
      </View>
    </Button>
  );
}

export const AppointmentSearchResultItem = memo(
  AppointmentSearchResultItemComponent,
);
