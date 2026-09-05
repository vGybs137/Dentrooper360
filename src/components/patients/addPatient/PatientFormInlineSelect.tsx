import { memo, type ReactNode } from "react";
import { View } from "react-native";

import { InlineSelect, type InlineSelectProps } from "@/components/ui";

import { usePatientFormFocusField } from "./PatientFormFocusContext";

type PatientFormInlineSelectProps = InlineSelectProps & {
  onBeforeSearchFocus?: () => void;
};

function PatientFormInlineSelectComponent({
  onBeforeSearchFocus,
  onSearchFocus,
  onSearchBlur,
  ...props
}: PatientFormInlineSelectProps) {
  const { fieldRef, reportFocus, onInputBlur: contextBlur } =
    usePatientFormFocusField();

  return (
    <View ref={fieldRef} collapsable={false}>
      <InlineSelect
        onSearchBlur={() => {
          contextBlur?.();
          onSearchBlur?.();
        }}
        onSearchFocus={() => {
          onBeforeSearchFocus?.();
          reportFocus(onSearchFocus);
        }}
        {...props}
      />
    </View>
  );
}

export const PatientFormInlineSelect = memo(PatientFormInlineSelectComponent);

type PatientFormFieldAnchorProps = {
  children: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function PatientFormFieldAnchor({
  children,
  onFocus,
  onBlur,
}: PatientFormFieldAnchorProps) {
  const { fieldRef, reportFocus, onInputBlur: contextBlur } =
    usePatientFormFocusField();

  return (
    <View
      ref={fieldRef}
      collapsable={false}
      onBlur={onBlur}
      onFocus={onFocus}
    >
      {children}
    </View>
  );
}

export function usePatientFormFieldFocusHandlers({
  onFocus,
  onBlur,
  onFocusWithoutMeasure,
}: {
  onFocus?: () => void;
  onBlur?: () => void;
  /** Used when no scroll-measure context is available (e.g. add-appointment sheet). */
  onFocusWithoutMeasure?: () => void;
} = {}) {
  const { fieldRef, reportFocus, onInputBlur: contextBlur } =
    usePatientFormFocusField();

  return {
    fieldRef,
    handleFocus: () => {
      onFocus?.();
      reportFocus(onFocusWithoutMeasure);
    },
    handleBlur: () => {
      contextBlur?.();
      onBlur?.();
    },
  };
}
