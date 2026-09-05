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
  ActivityIndicator,
  Keyboard,
  Platform,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormProvider } from "react-hook-form";

import { AddPatientAppointmentStep } from "@/components/patients/addPatient/AddPatientAppointmentStep";
import { AddPatientEssentialsStep } from "@/components/patients/addPatient/AddPatientEssentialsStep";
import { PatientFormFocusProvider } from "@/components/patients/addPatient/PatientFormFocusContext";
import { Button, ThemedIcon, ThemedText } from "@/components/ui";
import { AUTH_SLIDE_EASING, getAuthSlideDuration } from "@/helpers/authMotion";
import { useAddPatientForm } from "@/hooks/useAddPatientForm";
import { useBottomSheetKeyboardAvoidance } from "@/hooks/useBottomSheetKeyboardAvoidance";
import {
  useAddPatientIsPresented,
  useAddPatientPresentKey,
  useAddPatientStore,
} from "@/stores/addPatientStore";
import { useNativeColors } from "@/theme";
import { semantic } from "@/tokens";

const SHEET_HEIGHT_RATIO = 0.75;
const SHEET_MAX_HEIGHT = 620;

type SheetModalRef = ComponentRef<typeof BottomSheetModal>;
type ScrollRef = ComponentRef<typeof BottomSheetScrollView>;
type StepDirection = "forward" | "back";

const FOOTER_ESTIMATED_HEIGHT = 76;

export function AddPatientSheet() {
  const native = useNativeColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetRef = useRef<SheetModalRef>(null);
  const scrollRef = useRef<ScrollRef>(null);
  const contentRef = useRef<View>(null);
  const wasPresentedRef = useRef(false);
  /** True when dismiss was triggered by requestClose (X / submit), not a swipe. */
  const programmaticCloseRef = useRef(false);
  const stepDirectionRef = useRef<StepDirection>("forward");
  const hasStepTransitionedRef = useRef(false);
  const [pendingStepChange, setPendingStepChange] =
    useState<StepDirection | null>(null);
  const [panelCollapseKey, setPanelCollapseKey] = useState(0);

  const {
    inputFocused,
    keyboardInset,
    handleInputFocus,
    handleInputBlur,
    handleScrollBeginDrag,
  } = useBottomSheetKeyboardAvoidance(scrollRef);

  const onScrollBeginDrag = useCallback(() => {
    handleScrollBeginDrag();
    setPanelCollapseKey((current) => current + 1);
  }, [handleScrollBeginDrag]);

  const isPresented = useAddPatientIsPresented();
  const presentKey = useAddPatientPresentKey();
  const finishClose = useAddPatientStore((state) => state.finishClose);
  const requestClose = useAddPatientStore((state) => state.requestClose);

  const formState = useAddPatientForm();
  const {
    step,
    canSubmit,
    isSubmitting,
    submitError,
    isEditing,
    isLoadingPatient,
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
      programmaticCloseRef.current = true;
      wasPresentedRef.current = false;
      handleInputBlur();
      sheetRef.current?.dismiss();
    }
  }, [handleInputBlur, isPresented, presentKey]);

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

    // Only skip finishClose when a programmatic close was interrupted by open().
    if (programmaticCloseRef.current) {
      programmaticCloseRef.current = false;

      if (useAddPatientStore.getState().isPresented) {
        requestAnimationFrame(() => {
          wasPresentedRef.current = true;
          sheetRef.current?.present();
        });
        return;
      }
    }

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
      <BottomSheetFooter {...props}>
        <View
          className="min-h-control flex-row items-center justify-between border-t border-border-subtle px-inline pt-3"
          style={{
            backgroundColor: native.surface.default,
            paddingBottom: semantic.space.section + insets.bottom,
          }}
        >
          {step === "appointment" ? (
            <Button
              accessibilityLabel="Go back to essentials step"
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
              disabled={
                step === "essentials"
                  ? isLoadingPatient
                  : !canSubmit || isSubmitting
              }
              label={
                step === "essentials"
                  ? "Next"
                  : isSubmitting
                    ? isEditing
                      ? "Saving..."
                      : "Adding..."
                    : isEditing
                      ? "Save"
                      : "Add"
              }
              onPress={step === "essentials" ? handleNext : handleSubmit}
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
      handleSubmit,
      insets.bottom,
      isEditing,
      isLoadingPatient,
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
        (inputFocused ? keyboardInset : 0),
    }),
    [insets.bottom, inputFocused, keyboardInset],
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
      <BottomSheetScrollView
        ref={scrollRef}
        contentContainerStyle={contentPadding}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        onScrollBeginDrag={onScrollBeginDrag}
      >
        <FormProvider {...formState.form}>
          <View ref={contentRef} collapsable={false}>
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
                {isEditing ? "Edit Patient" : "Add Patient"}
              </ThemedText>
              <Button
                accessibilityLabel="Close add patient"
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

            {isLoadingPatient ? (
              <View className="items-center py-8">
                <ActivityIndicator color={native.brand.default} />
              </View>
            ) : (
              <PatientFormFocusProvider
                contentRef={contentRef}
                onInputBlur={handleInputBlur}
                onInputFocus={handleInputFocus}
              >
                <Animated.View key={step} entering={entering}>
                  {step === "essentials" ? (
                    <AddPatientEssentialsStep
                      formState={formState}
                      onInputBlur={handleInputBlur}
                      panelCollapseKey={panelCollapseKey}
                    />
                  ) : (
                    <AddPatientAppointmentStep
                      formState={formState}
                      onInputBlur={handleInputBlur}
                      onInputFocus={handleInputFocus}
                    />
                  )}
                </Animated.View>
              </PatientFormFocusProvider>
            )}
          </View>
        </FormProvider>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
