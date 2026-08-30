import { useEvent, useHandler } from "react-native-reanimated";

type PagerScrollEvent = {
  position: number;
  offset: number;
};

type PagerScrollHandlers = {
  onPageScroll: (event: PagerScrollEvent) => void;
};

/** UI-thread `onPageScroll` for `Animated.createAnimatedComponent(PagerView)`. */
export function usePagerScrollHandler(
  handlers: PagerScrollHandlers,
  dependencies?: unknown[],
) {
  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies);

  return useEvent(
    (event) => {
      "worklet";
      const { onPageScroll } = handlers;
      if (onPageScroll && event.eventName.endsWith("onPageScroll")) {
        onPageScroll(event as unknown as PagerScrollEvent);
      }
    },
    ["onPageScroll"],
    doDependenciesDiffer,
  );
}
