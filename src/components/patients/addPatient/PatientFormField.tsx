import { useRef, type ReactNode } from "react";
import { View } from "react-native";

import { ThemedIcon, ThemedText, type ThemedTextInputProps } from "@/components/ui";
import type { ThemedIconProps } from "@/components/ui";
import { cn } from "@/utils/cn";

import { usePatientFormFocusField } from "./PatientFormFocusContext";

export const PATIENT_FORM_INPUT_CLASS = "w-full px-inline";
export const PATIENT_FORM_MULTILINE_INPUT_CLASS = "min-h-[72px] w-full px-inline";

type PatientFormInputProps = Omit<ThemedTextInputProps, "as"> & {
  hideInlineError?: boolean;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
};

export function PatientFormInput({
  multiline,
  hideInlineError,
  onInputFocus,
  onInputBlur,
  onFocus,
  onBlur,
  className,
  containerClassName,
  ...props
}: PatientFormInputProps) {
  const { fieldRef, reportFocus, onInputBlur: contextBlur } =
    usePatientFormFocusField();

  return (
    <View ref={fieldRef} collapsable={false}>
      <ThemedText
        as="input"
        bottomSheetInput
        containerClassName={cn("min-h-0 w-full gap-0", containerClassName)}
        fieldVariant="bare"
        hideInlineError={hideInlineError}
        className={cn(
          multiline ? PATIENT_FORM_MULTILINE_INPUT_CLASS : PATIENT_FORM_INPUT_CLASS,
          className,
        )}
        multiline={multiline}
        onBlur={(event) => {
          contextBlur?.();
          onInputBlur?.();
          onBlur?.(event);
        }}
        onFocus={(event) => {
          onInputFocus?.();
          reportFocus();
          onFocus?.(event);
        }}
        {...props}
      />
    </View>
  );
}

type PatientFormFieldRowProps = {
  icon: NonNullable<ThemedIconProps["name"]>;
  children: ReactNode;
  /** `center` for single-line rows; `start` for multiline fields. */
  align?: "center" | "start";
};

export function PatientFormFieldRow({
  icon,
  children,
  align = "start",
}: PatientFormFieldRowProps) {
  return (
    <View
      className={cn(
        "w-full flex-row gap-3",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      <View
        className={cn(
          "size-5 shrink-0 items-center justify-center",
          align === "start" && "mt-stack-compact",
        )}
      >
        <ThemedIcon dimension={20} name={icon} tone="muted" />
      </View>
      <View className="min-w-0 flex-1">{children}</View>
    </View>
  );
}
