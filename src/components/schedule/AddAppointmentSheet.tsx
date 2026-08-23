import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { SymbolView } from "expo-symbols";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, ThemedText } from "@/components/ui";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/authMotion";
import { useAddAppointmentForm } from "@/hooks/useAddAppointmentForm";
import {
  useAddAppointmentIsPresented,
  useAddAppointmentStore,
} from "@/stores";
import { useThemeTokens } from "@/theme";

import { AddAppointmentDetailsStep } from "./AddAppointmentDetailsStep";
import { AddAppointmentPatientStep } from "./AddAppointmentPatientStep";

const SHEET_HEIGHT_RATIO = 0.75;
const SHEET_MAX_HEIGHT = 620;

type SheetModalRef = ComponentRef<typeof BottomSheetModal>;
type StepDirection = "forward" | "back";

export function AddAppointmentSheet() {
  const theme = useThemeTokens();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetRef = useRef<SheetModalRef>(null);
  const wasPresentedRef = useRef(false);
  const stepDirectionRef = useRef<StepDirection>("forward");
  const hasStepTransitionedRef = useRef(false);
  const [pendingStepChange, setPendingStepChange] = useState<StepDirection | null>(
    null,
  );

  const isPresented = useAddAppointmentIsPresented();
  const finishClose = useAddAppointmentStore((state) => state.finishClose);
  const requestClose = useAddAppointmentStore((state) => state.requestClose);

  const formState = useAddAppointmentForm();
  const {
    step,
    canSubmit,
    isSubmitting,
    submitError,
    goNext,
    goBack,
    submit,
  } = formState;

  const slideDuration = getAuthSlideDuration(theme);
  const snapHeight = Math.min(
    windowHeight * SHEET_HEIGHT_RATIO,
    SHEET_MAX_HEIGHT,
  );
  const snapPoints = useMemo(() => [snapHeight], [snapHeight]);

  useEffect(() => {
    if (isPresented) {
      wasPresentedRef.current = true;
      hasStepTransitionedRef.current = false;
      stepDirectionRef.current = "forward";
      setPendingStepChange(null);
      sheetRef.current?.present();
      return;
    }

    if (wasPresentedRef.current) {
      wasPresentedRef.current = false;
      sheetRef.current?.dismiss();
    }
  }, [isPresented]);

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

  const handleDismiss = useCallback(() => {
    wasPresentedRef.current = false;
    finishClose();
  }, [finishClose]);

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

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.35}
        pressBehavior="close"
      />
    ),
    [],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View
          className="flex-row items-center justify-between border-t border-border-subtle px-inline pt-3"
          style={{
            backgroundColor: theme.palette.surface.default,
            paddingBottom: theme.semantic.space.section,
          }}
        >
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

          <View className="min-w-0 flex-1 items-end gap-stack-compact pl-inline">
            {submitError ? (
              <ThemedText tone="alert" variant="body">
                {submitError}
              </ThemedText>
            ) : null}
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
      </BottomSheetFooter>
    ),
    [
      canSubmit,
      handleBack,
      handleNext,
      insets.bottom,
      isSubmitting,
      step,
      submit,
      submitError,
      theme,
    ],
  );

  const handleIndicatorStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.foreground.muted,
    }),
    [theme],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: theme.palette.surface.default,
      borderTopLeftRadius: theme.semantic.radius.card,
      borderTopRightRadius: theme.semantic.radius.card,
    }),
    [theme],
  );

  const hasStepTransitioned = hasStepTransitionedRef.current;
  const entering = hasStepTransitioned
    ? FadeIn.duration(slideDuration).easing(AUTH_SLIDE_EASING)
    : undefined;
  const exiting = hasStepTransitioned
    ? FadeOut.duration(slideDuration).easing(AUTH_SLIDE_EASING)
    : undefined;

  return (
    <BottomSheetModal
      ref={sheetRef}
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      enableDynamicSizing={false}
      enablePanDownToClose
      footerComponent={renderFooter}
      handleIndicatorStyle={handleIndicatorStyle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onDismiss={handleDismiss}
      snapPoints={snapPoints}
    >
      <BottomSheetView style={{ flex: 1 }}>
        <View
          className="flex-row items-center justify-between px-inline pb-3 pt-stack-compact"
          style={{
            borderBottomWidth: theme.semantic.borderWidth.subtle,
            borderBottomColor: theme.palette.border.subtle,
          }}
        >
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
            entering={entering}
            exiting={exiting}
            style={{ flex: 1 }}
          >
            <BottomSheetScrollView
              contentContainerStyle={{
                paddingHorizontal: theme.semantic.space.inline.default,
                paddingTop: theme.semantic.space.stack.default,
                paddingBottom: theme.semantic.space.section,
              }}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
            >
              {step === "patient" ? (
                <AddAppointmentPatientStep formState={formState} />
              ) : (
                <AddAppointmentDetailsStep formState={formState} />
              )}
            </BottomSheetScrollView>
          </Animated.View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
