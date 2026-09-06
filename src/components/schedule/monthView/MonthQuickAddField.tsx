import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  View,
  type View as RNView,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import {
  MONTH_QUICK_ADD_COLLAPSED_HEIGHT,
  MONTH_QUICK_ADD_EXPANDED_HEIGHT,
} from "@/constants/schedule";
import { createMonthQuickAddAppointment } from "@/helpers/createMonthQuickAddAppointment";
import { useUserScheduleHours } from "@/hooks/schedule/useUserScheduleHours";
import { useAuthUser } from "@/stores";
import type { MonthDayEventPreview } from "@/types/schedule";
import type { DayKey } from "@/utils/calendar";

export {
  MONTH_QUICK_ADD_COLLAPSED_HEIGHT,
  MONTH_QUICK_ADD_EXPANDED_HEIGHT,
};

const FOCUS_ANIMATION = {
  duration: 280,
  easing: Easing.bezier(0.05, 0.7, 0.1, 1),
} as const;

export type MonthQuickAddFieldProps = {
  dayKey: DayKey;
  events: MonthDayEventPreview[];
  /** Optional controlled placeholder override. */
  placeholder?: string;
};

function MonthQuickAddFieldComponent({
  dayKey,
  events,
  placeholder = "Add appointment...",
}: MonthQuickAddFieldProps) {
  const native = useNativeColors();
  const user = useAuthUser();
  const { hoursForDayKey } = useUserScheduleHours();
  const dayHours = useMemo(
    () => hoursForDayKey(dayKey),
    [dayKey, hoursForDayKey],
  );
  const reservedRef = useRef<RNView>(null);
  const verticalPadRef = useRef(0);
  const submittingRef = useRef(false);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const focusProgress = useSharedValue(0);
  /** How far to lift the pill so it sits on the keyboard (not full keyboard height). */
  const liftSV = useSharedValue(0);

  // Equal inset above/below the pill. Do not use safe-area bottom — NativeTabs
  // already sit under this screen, so insets.bottom would leave a large empty gap.
  const verticalPad = semantic.space.stack.compact;
  verticalPadRef.current = verticalPad;
  const sideInset = semantic.space.page;
  const canSubmit = text.trim().length > 0 && !isSubmitting;

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, FOCUS_ANIMATION);
    if (!focused) {
      liftSV.value = withTiming(0, FOCUS_ANIMATION);
    }
  }, [focused, focusProgress, liftSV]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const animateLift = (nextLift: number, duration: number) => {
      liftSV.value = withTiming(Math.max(0, nextLift), {
        duration: duration > 0 ? duration : FOCUS_ANIMATION.duration,
        easing: FOCUS_ANIMATION.easing,
      });
    };

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const duration =
        event.duration > 0 ? event.duration : FOCUS_ANIMATION.duration;
      // Keyboard top in window coords — compare to the pill's resting bottom.
      // Do not use full keyboard height: the field already sits above the tab bar.
      const keyboardTop = event.endCoordinates.screenY;
      reservedRef.current?.measureInWindow((_x, y, _width, height) => {
        const pillBottom = y + height - verticalPadRef.current;
        const lift = pillBottom - keyboardTop;
        animateLift(lift, duration);
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      const duration =
        "duration" in event &&
        typeof event.duration === "number" &&
        event.duration > 0
          ? event.duration
          : FOCUS_ANIMATION.duration;
      animateLift(0, duration);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [liftSV]);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || submittingRef.current) return;

    if (!user?.id) {
      Alert.alert(
        "Unable to add appointment",
        "You must be signed in to create an appointment.",
      );
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    Keyboard.dismiss();

    try {
      if (!dayHours) {
        Alert.alert(
          "Unable to add appointment",
          "No working hours are configured for this day.",
        );
        return;
      }

      const created = await createMonthQuickAddAppointment({
        text: trimmed,
        dayKey,
        events,
        providerId: user.id,
        startHour: dayHours.startHour,
        endHour: dayHours.endHour,
      });
      if (created) {
        setText("");
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [dayHours, dayKey, events, text, user?.id]);

  const reservedStyle = useMemo(
    () => ({
      height: MONTH_QUICK_ADD_COLLAPSED_HEIGHT + verticalPad * 2,
      zIndex: semantic.zIndex.sticky,
    }),
    [verticalPad],
  );

  const pillAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      focusProgress.value,
      [0, 1],
      [MONTH_QUICK_ADD_COLLAPSED_HEIGHT, MONTH_QUICK_ADD_EXPANDED_HEIGHT],
    );
    const marginHorizontal = interpolate(
      focusProgress.value,
      [0, 1],
      [sideInset, 0],
    );
    const translateY = -liftSV.value * focusProgress.value;

    return {
      height,
      marginHorizontal,
      transform: [{ translateY }],
    };
  });

  const pillStaticStyle = useMemo(
    () => ({
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingLeft: semantic.space.inline.default,
      paddingRight: semantic.space.inline.compact,
      backgroundColor: native.calendar.quickAdd,
      borderRadius: semantic.radius.pill,
      // Soft lift so the field reads above the calendar in light mode.
      shadowColor: native.foreground.default,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: semantic.elevation.raised,
    }),
    [native],
  );

  const inputChromeStyle = useMemo(
    () => ({
      flex: 1,
    }),
    [],
  );

  const plusHitStyle = useMemo(
    () => ({
      width: semantic.size.control,
      height: semantic.size.control,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      opacity: canSubmit ? 1 : semantic.opacity.disabled,
    }),
    [canSubmit, native],
  );

  const slotStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: 0,
      right: 0,
      bottom: verticalPad,
    }),
    [verticalPad],
  );

  return (
    <View ref={reservedRef} pointerEvents="box-none" style={reservedStyle}>
      <Animated.View style={[slotStyle, pillAnimatedStyle]}>
        <View style={pillStaticStyle}>
          <ThemedText
            as="input"
            accessibilityLabel="Quick add appointment"
            blurOnSubmit
            className="py-0"
            containerClassName="min-h-0 flex-1 gap-0"
            editable={!isSubmitting}
            fieldVariant="bare"
            onBlur={() => setFocused(false)}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onSubmitEditing={() => {
              void handleSubmit();
            }}
            placeholder={placeholder}
            returnKeyType="done"
            style={inputChromeStyle}
            value={text}
          />
          <Button
            accessibilityLabel="Add appointment"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            hitSlop={8}
            onPress={() => {
              void handleSubmit();
            }}
            size="none"
            style={plusHitStyle}
            tone="neutral"
            variant="ghost"
          >
            <ThemedIcon
              dimension={22}
              name={{
                ios: "plus",
                android: "add",
                web: "add",
              }}
            />
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}

export const MonthQuickAddField = memo(MonthQuickAddFieldComponent);
