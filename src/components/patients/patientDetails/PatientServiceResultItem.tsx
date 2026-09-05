import dayjs from "dayjs";
import { memo, useCallback, useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import {
  Button,
  ThemedIcon,
  ThemedText,
  type ThemedIconProps,
} from "@/components/ui";
import { balanceIcon, calendarIcon, checkCircleIcon } from "@/constants";
import { MONTH_VIEW_EVENT_LIST_RAIL_WIDTH } from "@/constants/schedule";
import { AUTH_SLIDE_EASING } from "@/helpers/authMotion";
import type { PatientServiceItem } from "@/hooks/usePatientServices";
import { useNativeColors } from "@/theme";
import { primitives } from "@/tokens";

const NOTE_EXPAND_DURATION_MS = 280;
const NOTE_SLIDE_DISTANCE = 14;

const NOTE_EXPAND_TIMING = {
  duration: NOTE_EXPAND_DURATION_MS,
  easing: AUTH_SLIDE_EASING,
} as const;

export type PatientServiceResultItemProps = {
  item: PatientServiceItem;
  currency: string | null | undefined;
};

function formatServiceFee(
  fee: number,
  currency: string | null | undefined,
): string {
  const prefix = currency?.trim() || "$";
  return `${prefix} ${Math.abs(fee).toFixed(2)}`;
}

function MetricColumn({
  icon,
  label,
  value,
  align = "left",
  mutedValue = false,
}: {
  icon: NonNullable<ThemedIconProps["name"]>;
  label: string;
  value: string;
  align?: "left" | "right";
  mutedValue?: boolean;
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
        className={mutedValue ? "font-normal opacity-30" : "font-normal"}
        numberOfLines={1}
        tone="default"
        variant="label"
      >
        {value}
      </ThemedText>
    </View>
  );
}

function PatientServiceResultItemComponent({
  item,
  currency,
}: PatientServiceResultItemProps) {
  const native = useNativeColors();
  const [expanded, setExpanded] = useState(false);
  const [measuredNoteHeight, setMeasuredNoteHeight] = useState(0);
  const expandProgress = useSharedValue(0);
  const noteHeight = useSharedValue(0);
  const railColor = item.color ?? native.border.strong;
  const feeLabel = formatServiceFee(item.fee, currency);
  const codeLabel = item.code?.trim() || null;
  const statusLabel = item.status?.trim() || null;
  const noteLabel = item.note?.trim() || null;
  const postedLabel =
    item.isPosted && item.postedDate
      ? dayjs(item.postedDate).format("D MMM, YYYY")
      : item.isPosted
        ? "Posted"
        : "Not posted";
  const postedIcon = item.isPosted ? checkCircleIcon : calendarIcon;

  useEffect(() => {
    setMeasuredNoteHeight(0);
  }, [noteLabel]);

  useEffect(() => {
    expandProgress.value = withTiming(expanded ? 1 : 0, NOTE_EXPAND_TIMING);
  }, [expandProgress, expanded]);

  useEffect(() => {
    noteHeight.value = measuredNoteHeight;
  }, [measuredNoteHeight, noteHeight]);

  const toggleExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  const handleNoteLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height) + 4;
    if (nextHeight <= 4) {
      return;
    }

    setMeasuredNoteHeight((current) => Math.max(current, nextHeight));
  }, []);

  const noteShellStyle = useAnimatedStyle(() => ({
    height: noteHeight.value * expandProgress.value,
    overflow: "hidden" as const,
  }));

  const noteContentStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    transform: [
      {
        translateY: interpolate(
          expandProgress.value,
          [0, 1],
          [-NOTE_SLIDE_DISTANCE, 0],
        ),
      },
    ],
  }));

  return (
    <View>
      <Button
        accessibilityLabel={`${item.name}${codeLabel ? `, ${codeLabel}` : ""}${statusLabel ? `, ${statusLabel}` : ""}, ${feeLabel}, ${postedLabel}`}
        accessibilityState={{ expanded }}
        className="flex-row items-stretch gap-stack overflow-hidden py-stack pl-inline"
        onPress={toggleExpanded}
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

        <View className="min-w-0 flex-1 justify-center gap-inset-compact pr-inline">
          <View className="min-w-0 flex-row items-center gap-1.5">
            <ThemedText
              className="min-w-0 flex-1 shrink font-semibold"
              numberOfLines={1}
              variant="body"
            >
              {item.name}
              {codeLabel ? ` - ${codeLabel}` : ""}
            </ThemedText>
            {statusLabel ? (
              <ThemedText
                className="shrink-0 capitalize"
                numberOfLines={1}
                style={item.color ? { color: item.color } : undefined}
                tone={item.color ? "default" : "muted"}
                variant="label"
              >
                {statusLabel}
              </ThemedText>
            ) : null}
          </View>

          <View className="flex-row items-start justify-between">
            <MetricColumn icon={balanceIcon} label="Fee" value={feeLabel} />
            <MetricColumn
              align="right"
              icon={postedIcon}
              label="Posted"
              mutedValue={!item.isPosted}
              value={postedLabel}
            />
          </View>
        </View>
      </Button>

      <Animated.View style={noteShellStyle}>
        <View
          onLayout={handleNoteLayout}
          style={
            measuredNoteHeight === 0
              ? { position: "absolute", left: 0, right: 0, opacity: 0 }
              : undefined
          }
        >
          <Animated.View
            className="flex-row items-stretch gap-stack pb-stack pl-inline pr-inline"
            style={noteContentStyle}
          >
            <View
              style={{
                width: MONTH_VIEW_EVENT_LIST_RAIL_WIDTH,
                borderRadius: primitives.radius.xs,
                backgroundColor: native.brand.default,
                alignSelf: "stretch",
                minHeight: primitives.lineHeight.xs,
              }}
            />
            <View className="min-w-0 flex-1">
              <ThemedText
                numberOfLines={4}
                tone={noteLabel ? "default" : "muted"}
                variant="label"
              >
                {noteLabel ?? "No note"}
              </ThemedText>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

export const PatientServiceResultItem = memo(PatientServiceResultItemComponent);
