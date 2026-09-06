import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
  type BottomSheetScrollViewMethods,
} from "@gorhom/bottom-sheet";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  Keyboard,
  Platform,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormProvider } from "react-hook-form";

import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/authMotion";
import { useAddAppointmentForm } from "@/hooks/useAddAppointmentForm";
import {
  useAddAppointmentIsPresented,
  useAddAppointmentStore,
} from "@/stores";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

import { AddAppointmentDetailsStep } from "./AddAppointmentDetailsStep";
import { AddAppointmentPatientStep } from "./AddAppointmentPatientStep";

const SHEET_HEIGHT_RATIO = 0.75;
const SHEET_MAX_HEIGHT = 620;

type SheetModalRef = ComponentRef<typeof BottomSheetModal>;
type ScrollRef = ComponentRef<typeof BottomSheetScrollView>;
type StepDirection = "forward" | "back";

const FOOTER_ESTIMATED_HEIGHT = 76;

export function AddAppointmentSheet() {
  const native = useNativeColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetRef = useRef<SheetModalRef>(null);
  const scrollRef = useRef<ScrollRef>(null);
  const notesFocusedRef = useRef(false);
  const wasPresentedRef = useRef(false);
  const stepDirectionRef = useRef<StepDirection>("forward");
  const hasStepTransitionedRef = useRef(false);
  const [pendingStepChange, setPendingStepChange] = useState<StepDirection | null>(
    null,
  );
  const [notesFocused, setNotesFocused] = useState(false);
  const [notesKeyboardInset, setNotesKeyboardInset] = useState(0);

  const isPresented = useAddAppointmentIsPresented();
  const finishClose = useAddAppointmentStore((state) => state.finishClose);
  const requestClose = useAddAppointmentStore((state) => state.requestClose);

  const formState = useAddAppointmentForm();
  const {
    step,
    isSubmitting,
    submitError,
    isEditing,
    goNext,
    goBack,
    submit,
  } = formState;

  const slideDuration = getAuthSlideDuration();
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
      setNotesFocused(false);
      setNotesKeyboardInset(0);
      notesFocusedRef.current = false;
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
    Keyboard.dismiss();
    stepDirectionRef.current = "forward";
    hasStepTransitionedRef.current = true;
    setPendingStepChange("forward");
  }, []);

  const handleBack = useCallback(() => {
    Keyboard.dismiss();
    stepDirectionRef.current = "back";
    hasStepTransitionedRef.current = true;
    setPendingStepChange("back");
  }, []);

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
    submit();
  }, [submit]);

  const handleNotesFocus = useCallback(() => {
    notesFocusedRef.current = true;
    setNotesFocused(true);
  }, []);

  const handleNotesBlur = useCallback(() => {
    notesFocusedRef.current = false;
    setNotesFocused(false);
    setNotesKeyboardInset(0);
  }, []);

  // Track keyboard height only while notes is focused.
  useEffect(() => {
    if (!notesFocused) {
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      if (!notesFocusedRef.current) {
        return;
      }
      setNotesKeyboardInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setNotesKeyboardInset(0);
      notesFocusedRef.current = false;
      setNotesFocused(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [notesFocused]);

  const handleScrollBeginDrag = useCallback(() => {
    Keyboard.dismiss();
    handleNotesBlur();
  }, [handleNotesBlur]);

  const scrollNotesIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  // Scroll after keyboard inset is applied to content padding.
  useLayoutEffect(() => {
    if (!notesFocused || notesKeyboardInset <= 0) {
      return;
    }

    scrollNotesIntoView();
    const mid = setTimeout(scrollNotesIntoView, 120);
    const late = setTimeout(scrollNotesIntoView, 280);

    return () => {
      clearTimeout(mid);
      clearTimeout(late);
    };
  }, [notesFocused, notesKeyboardInset, scrollNotesIntoView]);

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
      // Do not pass bottomInset here — it lifts the footer and leaves a gap
      // where sheet content shows through the home-indicator / nav bar area.
      // Bake safe-area into padding so the opaque background covers the bottom.
      <BottomSheetFooter {...props}>
        <View
          className="min-h-control flex-row items-center justify-between border-t border-border-subtle px-inline pt-3"
          style={{
            backgroundColor: native.surface.default,
            paddingBottom: semantic.space.section + insets.bottom,
          }}
        >
          {step === "details" ? (
            <Button
              accessibilityLabel="Go back to patient step"
              bottomSheet
              className="size-control shrink-0 rounded-control border-strong border-border"
              hitSlop={8}
              onPress={handleBack}
              size="none"
              tone="neutral"
              variant="ghost"
            >
              <ThemedIcon
                dimension={20}
                name={{
                  ios: "chevron.left",
                  android: "chevron_left",
                  web: "chevron_left",
                }}
              />
            </Button>
          ) : (
            <View className="size-control shrink-0" />
          )}

          <View className="min-w-0 flex-1 items-end gap-stack-compact pl-inline">
            {submitError ? (
              <ThemedText tone="alert" variant="body">
                {submitError}
              </ThemedText>
            ) : null}
            <Button
              bottomSheet
              className="min-w-[120px]"
              disabled={isSubmitting}
              label={
                step === "patient"
                  ? "Next"
                  : isSubmitting
                    ? isEditing
                      ? "Saving..."
                      : "Adding..."
                    : isEditing
                      ? "Save"
                      : "Add"
              }
              onPress={step === "patient" ? handleNext : handleSubmit}
              tone="brand"
              variant="solid"
            />
          </View>
        </View>
      </BottomSheetFooter>
    ),
    [
      handleBack,
      handleNext,
      handleSubmit,
      insets.bottom,
      isEditing,
      isSubmitting,
      native,
      step,
      submitError,
    ],
  );

  const handleIndicatorStyle = useMemo(
    () => ({
      backgroundColor: native.foreground.muted,
    }),
    [native],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: native.surface.default,
      borderTopLeftRadius: semantic.radius.card,
      borderTopRightRadius: semantic.radius.card,
    }),
    [native],
  );

  const contentPadding = useMemo(
    () => ({
      paddingHorizontal: semantic.space.inline.default,
      paddingTop: semantic.space.stack.default,
      paddingBottom:
        semantic.space.section +
        FOOTER_ESTIMATED_HEIGHT +
        insets.bottom +
        (notesFocused ? notesKeyboardInset : 0),
    }),
    [insets.bottom, notesFocused, notesKeyboardInset],
  );

  const hasStepTransitioned = hasStepTransitionedRef.current;
  const entering = hasStepTransitioned
    ? FadeIn.duration(slideDuration).easing(AUTH_SLIDE_EASING)
    : undefined;

  return (
    <BottomSheetModal
      ref={sheetRef}
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      enableContentPanningGesture={false}
      enableDynamicSizing={false}
      enablePanDownToClose
      footerComponent={renderFooter}
      handleIndicatorStyle={handleIndicatorStyle}
      keyboardBehavior={Platform.OS === "ios" ? "interactive" : "extend"}
      keyboardBlurBehavior="restore"
      onDismiss={handleDismiss}
      snapPoints={snapPoints}
    >
      {/*
        BottomSheetScrollView must be a direct modal child (not inside
        BottomSheetView / flex:1 overflow wrappers) or gestures steal scroll.
        FormProvider must live inside this tree — the modal portals children
        out of the React parent that wraps BottomSheetModal.
      */}
      <BottomSheetScrollView
        ref={scrollRef}
        contentContainerStyle={contentPadding}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        onScrollBeginDrag={handleScrollBeginDrag}
      >
        <FormProvider {...formState.form}>
          <View
            className="mb-stack flex-row items-center justify-between pb-3"
            style={{
              borderBottomWidth: semantic.borderWidth.subtle,
              borderBottomColor: native.border.subtle,
              marginHorizontal: -semantic.space.inline.default,
              paddingHorizontal: semantic.space.inline.default,
            }}
          >
            <ThemedText variant="title">
              {isEditing ? "Edit Appointment" : "Add Appointment"}
            </ThemedText>
            <Button
              accessibilityLabel="Close add appointment"
              bottomSheet
              hitSlop={12}
              onPress={requestClose}
              size="sm"
              tone="neutral"
              variant="ghost"
            >
              <ThemedIcon
                dimension={22}
                name={{ ios: "xmark", android: "close", web: "close" }}
              />
            </Button>
          </View>

          <Animated.View key={step} entering={entering}>
            {step === "patient" ? (
              <AddAppointmentPatientStep formState={formState} />
            ) : (
              <AddAppointmentDetailsStep
                formState={formState}
                onNotesBlur={handleNotesBlur}
                onNotesFocus={handleNotesFocus}
              />
            )}
          </Animated.View>
        </FormProvider>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
