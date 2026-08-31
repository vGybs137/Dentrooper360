import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  View,
  type View as RNView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import { searchIcon } from "@/constants";
import {
  SEARCH_BAR_COLLAPSED_HEIGHT,
  SEARCH_BAR_EXPANDED_HEIGHT,
} from "@/helpers/searchBarLayout";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const FOCUS_ANIMATION = {
  duration: 280,
  easing: Easing.bezier(0.05, 0.7, 0.1, 1),
} as const;

const CLEAR_ICON = {
  ios: "xmark",
  android: "close",
  web: "close",
} as const;

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
  accessibilityLabel?: string;
};

function SearchBarComponent({
  value,
  onChangeText,
  autoFocus = false,
  placeholder = "Search...",
  accessibilityLabel = "Search",
}: SearchBarProps) {
  const native = useNativeColors();
  const insets = useSafeAreaInsets();
  const reservedRef = useRef<RNView>(null);
  const bottomPadRef = useRef(0);
  const keyboardGapRef = useRef(0);
  const [focused, setFocused] = useState(autoFocus);
  const focusProgress = useSharedValue(0);
  const liftSV = useSharedValue(0);

  const verticalPad = semantic.space.stack.compact;
  const bottomPad = verticalPad + insets.bottom;
  const keyboardGap = semantic.space.stack.default;
  bottomPadRef.current = bottomPad;
  keyboardGapRef.current = keyboardGap;
  const sideInset = semantic.space.page;
  const canClear = value.length > 0;

  const handleClear = useCallback(() => {
    onChangeText("");
  }, [onChangeText]);

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
      const keyboardTop = event.endCoordinates.screenY;
      reservedRef.current?.measureInWindow((_x, y, _width, height) => {
        const pillBottom = y + height - bottomPadRef.current;
        const lift = pillBottom - keyboardTop + keyboardGapRef.current;
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

  const reservedStyle = useMemo(
    () => ({
      height: SEARCH_BAR_COLLAPSED_HEIGHT + verticalPad + bottomPad,
      zIndex: semantic.zIndex.sticky,
    }),
    [bottomPad, verticalPad],
  );

  const pillAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      focusProgress.value,
      [0, 1],
      [SEARCH_BAR_COLLAPSED_HEIGHT, SEARCH_BAR_EXPANDED_HEIGHT],
    );
    const translateY = -liftSV.value * focusProgress.value;

    return {
      height,
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

  const clearHitStyle = useMemo(
    () => ({
      width: semantic.size.control,
      height: semantic.size.control,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    }),
    [],
  );

  const slotStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: 0,
      right: 0,
      bottom: bottomPad,
    }),
    [bottomPad],
  );

  return (
    <View ref={reservedRef} pointerEvents="box-none" style={reservedStyle}>
      <Animated.View
        style={[
          slotStyle,
          { marginHorizontal: sideInset },
          pillAnimatedStyle,
        ]}
      >
        <View style={pillStaticStyle}>
          <ThemedIcon
            name={searchIcon}
            style={{ marginRight: semantic.space.gap.compact }}
            tone="muted"
          />
          <ThemedText
            as="input"
            accessibilityLabel={accessibilityLabel}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            className="py-0"
            containerClassName="min-h-0 flex-1 gap-0"
            fieldVariant="bare"
            onBlur={() => setFocused(false)}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            placeholder={placeholder}
            returnKeyType="search"
            style={inputChromeStyle}
            value={value}
          />
          {canClear ? (
            <Button
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={handleClear}
              size="none"
              style={clearHitStyle}
              tone="neutral"
              variant="ghost"
            >
              <ThemedIcon dimension={22} name={CLEAR_ICON} tone="muted" />
            </Button>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

export const SearchBar = memo(SearchBarComponent);
