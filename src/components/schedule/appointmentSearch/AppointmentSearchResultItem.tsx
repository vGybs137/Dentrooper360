import { useRouter, type Href } from "expo-router";
import { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { formatTimeRange } from "@/helpers/timeFormat";
import { useHourFormat } from "@/stores/schedulePreferencesStore";
import { useThemeTokens } from "@/theme";
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
  const theme = useThemeTokens();
  const hourFormat = useHourFormat();
  const router = useRouter();
  const timeRange = formatTimeRange(event.startTime, event.endTime, hourFormat);
  const typeColor = event.color ?? theme.colors.borderStrong;
  const subjectParts = useMemo(
    () => splitSubjectByQuery(event.title, query),
    [event.title, query],
  );

  const rowStyle = useMemo(
    () => ({
      flexDirection: "row" as const,
      alignItems: "stretch" as const,
      overflow: "hidden" as const,
      paddingVertical: theme.semantic.space.stack.compact,
      gap: theme.semantic.space.stack.compact,
    }),
    [theme],
  );

  const railStyle = useMemo(
    () => ({
      width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
      borderRadius: theme.primitives.radius.xs,
      backgroundColor: typeColor,
    }),
    [theme, typeColor],
  );

  const titleStyle = useMemo(
    () => ({
      fontSize: theme.primitives.fontSize.sm,
      lineHeight: theme.primitives.lineHeight.sm,
      fontWeight: theme.primitives.fontWeight.semibold,
    }),
    [theme],
  );

  const metaStyle = useMemo(
    () => ({
      marginTop: theme.primitives.space[2],
      color: theme.colors.textMuted,
      fontSize: theme.primitives.fontSize.xs,
      lineHeight: theme.primitives.lineHeight.xs,
      fontWeight: theme.primitives.fontWeight.regular,
    }),
    [theme],
  );

  const highlightStyle = useMemo(
    () => ({
      color: theme.palette.brand.default,
      fontWeight: theme.primitives.fontWeight.bold as "700",
    }),
    [theme],
  );

  const subjectStyle = useMemo(
    () => ({
      color: theme.colors.text,
    }),
    [theme],
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}${event.typeName ? ` - ${event.typeName}` : ""}, ${timeRange}`}
      onPress={() => router.push(`/appointments/${event.id}` as Href)}
      style={rowStyle}
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
            <Text style={{ color: theme.colors.text }}> - </Text>
          ) : null}
          {event.typeName ? (
            <Text style={{ color: typeColor }}>{event.typeName}</Text>
          ) : null}
        </Text>
        <Text numberOfLines={1} style={metaStyle}>
          {timeRange}
        </Text>
      </View>
    </Pressable>
  );
}

export const AppointmentSearchResultItem = memo(
  AppointmentSearchResultItemComponent,
);
