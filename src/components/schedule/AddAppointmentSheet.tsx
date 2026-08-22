import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";

import { BottomSheet, Button, ThemedText } from "@/components/ui";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/authMotion";
import { useAddAppointmentForm } from "@/hooks/useAddAppointmentForm";
import {
  useAddAppointmentIsPresented,
  useAddAppointmentSheetVisible,
  useAddAppointmentSlot,
  useAddAppointmentStore,
} from "@/stores";
import { useThemeTokens } from "@/theme";

import { AddAppointmentDetailsStep } from "./AddAppointmentDetailsStep";
import { AddAppointmentPatientStep } from "./AddAppointmentPatientStep";

const SHEET_HEIGHT_RATIO = 0.75;
const SHEET_MAX_HEIGHT = 620;

type StepDirection = "forward" | "back";

export function AddAppointmentSheet() {
  const theme = useThemeTokens();
  const { height: windowHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const notesFocusedRef = useRef(false);
  const stepDirectionRef = useRef<StepDirection>("forward");
  const hasStepTransitionedRef = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [pendingStepChange, setPendingStepChange] = useState<
    StepDirection | null
  >(null);

  const slot = useAddAppointmentSlot();
  const isPresented = useAddAppointmentIsPresented();
  const sheetVisible = useAddAppointmentSheetVisible();
  const finishClose = useAddAppointmentStore((state) => state.finishClose);

  const formState = useAddAppointmentForm();
  const {
    step,
    canSubmit,
    isSubmitting,
    submitError,
    goNext,
    goBack,
    submit,
    requestClose,
  } = formState;

  const slideDuration = getAuthSlideDuration(theme);

  const sheetHeight = Math.min(
    windowHeight * SHEET_HEIGHT_RATIO,
    SHEET_MAX_HEIGHT,
    Math.max(windowHeight - keyboardHeight, 280),
  );

  useEffect(() => {
    if (!isPresented) {
      return;
    }

    hasStepTransitionedRef.current = false;
    stepDirectionRef.current = "forward";
    setPendingStepChange(null);
  }, [isPresented, slot?.start.getTime()]);

  // Apply direction on the current step first, then change step so exiting animates correctly.
  useLayoutEffect(() => {
    if (!pendingStepChange) {
      return;
    }

    if (pendingStepChange === "forward") {
      goNext();
    } else {
      goBack();
    }
    setPendingStepChange(null);
  }, [pendingStepChange, goBack, goNext]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (keyboardHeight <= 0 || !notesFocusedRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);

    return () => clearTimeout(timeout);
  }, [keyboardHeight]);

  const handleNotesFocus = useCallback(() => {
    notesFocusedRef.current = true;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const handleNotesBlur = useCallback(() => {
    notesFocusedRef.current = false;
  }, []);

  const handleNext = useCallback(() => {
    stepDirectionRef.current = "forward";
    hasStepTransitionedRef.current = true;
    setPendingStepChange("forward");
  }, []);

  const handleBack = useCallback(() => {
    stepDirectionRef.current = "back";
    hasStepTransitionedRef.current = true;
    setPendingStepChange("back");
  }, []);

  const handleExitComplete = useCallback(() => {
    if (!useAddAppointmentStore.getState().sheetVisible) {
      finishClose();
    }
  }, [finishClose]);

  const stepDirection = stepDirectionRef.current;
  const hasStepTransitioned = hasStepTransitionedRef.current;

  // Forward: current exits left, next enters from right.
  // Back: current exits right, previous enters from left.
  const stepEntering =
    stepDirection === "forward"
      ? SlideInRight.duration(slideDuration).easing(AUTH_SLIDE_EASING)
      : SlideInLeft.duration(slideDuration).easing(AUTH_SLIDE_EASING);

  const stepExiting =
    stepDirection === "forward"
      ? SlideOutLeft.duration(slideDuration).easing(AUTH_SLIDE_EASING)
      : SlideOutRight.duration(slideDuration).easing(AUTH_SLIDE_EASING);

  if (!isPresented || !slot) {
    return null;
  }

  return (
    <Modal
      visible={isPresented}
      transparent
      animationType="none"
      onRequestClose={requestClose}
    >
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="Dismiss add appointment"
          className="absolute inset-0 bg-black/35"
          onPress={requestClose}
        />
        <View
          className="justify-end"
          pointerEvents="box-none"
          style={{ marginBottom: keyboardHeight }}
        >
          <BottomSheet
            animated
            bottomInset={0}
            className="px-0 pt-0"
            onExitComplete={handleExitComplete}
            style={{ height: sheetHeight }}
            visible={sheetVisible}
          >
            <View className="flex-1 gap-stack">
              <View className="flex-row items-center justify-between border-b border-border-subtle px-inline pb-3 pt-4">
                <ThemedText variant="title">Add Appointment</ThemedText>
                <Pressable
                  accessibilityLabel="Close add appointment"
                  hitSlop={12}
                  onPress={requestClose}
                >
                  <SymbolView
                    name={{ ios: "xmark", android: "close", web: "close" }}
                    size={22}
                    tintColor={theme.palette.foreground.default}
                  />
                </Pressable>
              </View>

              <View className="flex-1 overflow-hidden">
                <Animated.View
                  key={step}
                  className="flex-1"
                  entering={hasStepTransitioned ? stepEntering : undefined}
                  exiting={hasStepTransitioned ? stepExiting : undefined}
                >
                  <ScrollView
                    ref={scrollRef}
                    className="flex-1"
                    contentContainerClassName="grow px-inline pb-section"
                    keyboardDismissMode="interactive"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {step === "patient" ? (
                      <AddAppointmentPatientStep formState={formState} />
                    ) : (
                      <AddAppointmentDetailsStep
                        formState={formState}
                        onNotesBlur={handleNotesBlur}
                        onNotesFocus={handleNotesFocus}
                      />
                    )}
                    {submitError ? (
                      <ThemedText
                        className="mt-stack"
                        tone="alert"
                        variant="body"
                      >
                        {submitError}
                      </ThemedText>
                    ) : null}
                  </ScrollView>
                </Animated.View>
              </View>

              <View className="flex-row items-center justify-between border-t border-border-subtle px-inline pb-section pt-3">
                {step === "details" ? (
                  <Pressable
                    accessibilityLabel="Go back to patient step"
                    accessibilityRole="button"
                    className="size-12 items-center justify-center rounded-control border-strong border-border"
                    hitSlop={8}
                    onPress={handleBack}
                  >
                    <SymbolView
                      name={{
                        ios: "chevron.left",
                        android: "chevron_left",
                        web: "chevron_left",
                      }}
                      size={20}
                      tintColor={theme.palette.foreground.default}
                    />
                  </Pressable>
                ) : (
                  <View className="w-12" />
                )}
                <Button
                  className="min-w-[120px]"
                  disabled={
                    step === "patient" ? false : !canSubmit || isSubmitting
                  }
                  label={
                    step === "patient"
                      ? "Next"
                      : isSubmitting
                        ? "Adding..."
                        : "Add"
                  }
                  onPress={step === "patient" ? handleNext : submit}
                  tone="brand"
                  variant="solid"
                />
              </View>
            </View>
          </BottomSheet>
        </View>
      </View>
    </Modal>
  );
}
