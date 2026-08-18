export const SPACE_MINI_UNIT: 2;
export const SPACE_BASE_UNIT: 8;
export const TYPE_BASE_SIZE: 16;
export const TYPE_SCALE_RATIO: 1.2;

export function space(miniSteps: number): number;
export function snapToMiniUnit(value: number): number;
export function snapToBaseUnit(value: number): number;
export function typeSize(stepsFromBase: number): number;

export const primitives: {
  space: {
    0: number;
    2: number;
    4: number;
    8: number;
    12: number;
    16: number;
    24: number;
    32: number;
    40: number;
    48: number;
    64: number;
    80: number;
  };
  radius: {
    none: number;
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
    full: number;
  };
  borderWidth: {
    none: number;
    hairline: number;
    DEFAULT: number;
    2: number;
    4: number;
  };
  elevation: {
    0: number;
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
    "4xl": number;
  };
  lineHeight: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    "2xl": number;
    "3xl": number;
    "4xl": number;
  };
  fontWeight: {
    regular: "400";
    medium: "500";
    semibold: "600";
    bold: "700";
  };
  iconSize: {
    sm: number;
    md: number;
    lg: number;
  };
  controlSize: {
    sm: number;
    md: number;
    lg: number;
    touch: number;
  };
  duration: {
    micro: number;
    fast: number;
    normal: number;
    slow: number;
    overlay: number;
  };
  easing: {
    standard: string;
    emphasized: string;
    enter: string;
    exit: string;
  };
  opacity: {
    disabled: number;
    loading: number;
    scrim: number;
  };
  zIndex: {
    base: number;
    raised: number;
    sticky: number;
    overlay: number;
    dialog: number;
    popover: number;
    toast: number;
    critical: number;
  };
};
