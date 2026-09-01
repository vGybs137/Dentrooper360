import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Keyboard, Platform } from "react-native";

const SCROLL_RETRY_MS = [120, 280] as const;
const SCROLL_TOP_OFFSET = 24;

export function useBottomSheetKeyboardAvoidance(
  scrollRef: RefObject<{ scrollTo: (options: { y?: number; animated?: boolean }) => void } | null>,
) {
  const inputFocusedRef = useRef(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const scrollTargetYRef = useRef<number | null>(null);

  const handleInputBlur = useCallback(() => {
    inputFocusedRef.current = false;
    setInputFocused(false);
    setKeyboardInset(0);
    scrollTargetYRef.current = null;
  }, []);

  const scrollFocusedIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      const scrollTargetY = scrollTargetYRef.current;
      if (scrollTargetY == null) {
        return;
      }

      scrollRef.current?.scrollTo({
        y: Math.max(0, scrollTargetY - SCROLL_TOP_OFFSET),
        animated: true,
      });
    });
  }, [scrollRef]);

  const handleInputFocus = useCallback(
    (scrollY?: number) => {
      inputFocusedRef.current = true;
      setInputFocused(true);
      scrollTargetYRef.current = scrollY ?? null;
      scrollFocusedIntoView();
    },
    [scrollFocusedIntoView],
  );

  useEffect(() => {
    if (!inputFocused) {
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      if (!inputFocusedRef.current) {
        return;
      }
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [inputFocused]);

  useLayoutEffect(() => {
    if (!inputFocused || keyboardInset <= 0) {
      return;
    }

    scrollFocusedIntoView();
    const timers = SCROLL_RETRY_MS.map((delay) =>
      setTimeout(scrollFocusedIntoView, delay),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [inputFocused, keyboardInset, scrollFocusedIntoView]);

  return {
    inputFocused,
    keyboardInset,
    handleInputFocus,
    handleInputBlur,
  };
}
