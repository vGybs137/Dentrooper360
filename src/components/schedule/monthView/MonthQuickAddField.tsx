import { SymbolView } from "expo-symbols";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  TextInput,
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

import { createMonthQuickAddAppointment } from "@/helpers/createMonthQuickAddAppointment";
import { useUserScheduleHours } from "@/hooks/schedule/useUserScheduleHours";
import { useAuthUser } from "@/stores";
import { useThemeTokens } from "@/theme";
import type { MonthDayEventPreview } from "@/types/schedule";
import type { DayKey } from "@/utils/calendar";

/** Collapsed pill height (token: control). */
export const MONTH_QUICK_ADD_COLLAPSED_HEIGHT = 40;

/** Expanded pill height while focused (token: control-lg + extra). */
export const MONTH_QUICK_ADD_EXPANDED_HEIGHT = 56;

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
  const theme = useThemeTokens();
  const user = useAuthUser();
  const { startHour, endHour } = useUserScheduleHours();
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
  const verticalPad = theme.semantic.space.stack.compact;
  verticalPadRef.current = verticalPad;
  const sideInset = theme.semantic.space.page;
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
      const created = await createMonthQuickAddAppointment({
        text: trimmed,
        dayKey,
        events,
        providerId: user.id,
        startHour,
        endHour,
      });
      if (created) {
        setText("");
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [dayKey, endHour, events, startHour, text, user?.id]);

  const reservedStyle = useMemo(
    () => ({
      height: MONTH_QUICK_ADD_COLLAPSED_HEIGHT + verticalPad * 2,
      zIndex: theme.semantic.zIndex.sticky,
    }),
    [theme, verticalPad],
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
      paddingLeft: theme.semantic.space.inline.default,
      paddingRight: theme.semantic.space.inline.compact,
      backgroundColor: theme.palette.surface.raised,
      borderRadius: theme.semantic.radius.pill,
      overflow: "hidden" as const,
    }),
    [theme],
  );

  const inputStyle = useMemo(
    () => ({
      flex: 1,
      paddingVertical: 0,
      color: theme.palette.foreground.default,
      fontSize: theme.primitives.fontSize.md,
      lineHeight: theme.primitives.lineHeight.md,
    }),
    [theme],
  );

  const plusHitStyle = useMemo(
    () => ({
      width: theme.semantic.size.control,
      height: theme.semantic.size.control,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      opacity: canSubmit ? 1 : theme.semantic.opacity.disabled,
    }),
    [canSubmit, theme],
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
          <TextInput
            value={text}
            onChangeText={setText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={theme.palette.foreground.muted}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={() => {
              void handleSubmit();
            }}
            editable={!isSubmitting}
            style={inputStyle}
            accessibilityLabel="Quick add appointment"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add appointment"
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            hitSlop={8}
            onPress={() => {
              void handleSubmit();
            }}
            style={plusHitStyle}
          >
            <SymbolView
              name={{
                ios: "plus",
                android: "add",
                web: "add",
              }}
              size={22}
              tintColor={theme.palette.foreground.default}
            />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

export const MonthQuickAddField = memo(MonthQuickAddFieldComponent);
