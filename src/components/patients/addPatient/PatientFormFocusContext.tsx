import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { View } from "react-native";

type PatientFormFocusContextValue = {
  focusField: (field: View) => void;
  onInputBlur?: () => void;
};

const PatientFormFocusContext = createContext<PatientFormFocusContextValue | null>(
  null,
);

type PatientFormFocusProviderProps = {
  contentRef: RefObject<View | null>;
  onInputFocus: (scrollY?: number) => void;
  onInputBlur?: () => void;
  children: ReactNode;
};

export function PatientFormFocusProvider({
  contentRef,
  onInputFocus,
  onInputBlur,
  children,
}: PatientFormFocusProviderProps) {
  const focusField = useCallback(
    (field: View) => {
      const content = contentRef.current;
      if (!content) {
        onInputFocus();
        return;
      }

      field.measureLayout(
        content,
        (_x, y) => {
          onInputFocus(y);
        },
        () => {
          onInputFocus();
        },
      );
    },
    [contentRef, onInputFocus],
  );

  return (
    <PatientFormFocusContext.Provider value={{ focusField, onInputBlur }}>
      {children}
    </PatientFormFocusContext.Provider>
  );
}

export function usePatientFormFocusField() {
  const context = useContext(PatientFormFocusContext);
  const fieldRef = useRef<View>(null);

  const reportFocus = useCallback(
    (fallback?: () => void) => {
      if (fieldRef.current && context) {
        context.focusField(fieldRef.current);
        return;
      }

      fallback?.();
    },
    [context],
  );

  return {
    fieldRef,
    reportFocus,
    onInputBlur: context?.onInputBlur,
    hasFocusContext: Boolean(context),
  };
}
