const SPACE_MINI_UNIT = 2;
const SPACE_BASE_UNIT = 8;
const TYPE_BASE_SIZE = 16;
const TYPE_SCALE_RATIO = 1.2;

function space(miniSteps) {
  return SPACE_MINI_UNIT * miniSteps;
}

function snapToMiniUnit(value) {
  return Math.round(value / SPACE_MINI_UNIT) * SPACE_MINI_UNIT;
}

function snapToBaseUnit(value) {
  return Math.round(value / 4) * 4;
}

function typeSize(stepsFromBase) {
  const raw = TYPE_BASE_SIZE * TYPE_SCALE_RATIO ** stepsFromBase;
  return raw < TYPE_BASE_SIZE ? snapToMiniUnit(raw) : snapToBaseUnit(raw);
}

function typeLineHeight(fontSize, ratio) {
  return snapToBaseUnit(fontSize * ratio);
}

const spaceScale = {
  0: space(0),
  2: space(1),
  4: space(2),
  8: space(4),
  12: space(6),
  16: space(8),
  24: space(12),
  32: space(16),
  40: space(20),
  48: space(24),
  64: space(32),
  80: space(40),
};

const radiusScale = {
  none: spaceScale[0],
  xs: spaceScale[2],
  sm: spaceScale[4],
  md: spaceScale[8],
  lg: spaceScale[12],
  xl: spaceScale[16],
  "2xl": spaceScale[24],
  full: 9999,
};

const borderWidthScale = {
  none: 0,
  hairline: 1,
  DEFAULT: 1,
  2: 2,
  4: space(2),
};

const elevationScale = {
  0: 0,
  1: 1,
  2: 3,
  3: 6,
  4: 8,
  5: 12,
};

const fontSizeScale = {
  xs: typeSize(-2),
  sm: typeSize(-1),
  md: TYPE_BASE_SIZE,
  lg: typeSize(1),
  xl: typeSize(2),
  "2xl": typeSize(3),
  "3xl": typeSize(4),
  "4xl": typeSize(5),
};

const lineHeightScale = {
  xs: typeLineHeight(fontSizeScale.xs, 1.35),
  sm: typeLineHeight(fontSizeScale.sm, 1.4),
  md: typeLineHeight(fontSizeScale.md, 1.5),
  lg: typeLineHeight(fontSizeScale.lg, 1.45),
  xl: typeLineHeight(fontSizeScale.xl, 1.4),
  "2xl": typeLineHeight(fontSizeScale["2xl"], 1.3),
  "3xl": typeLineHeight(fontSizeScale["3xl"], 1.2),
  "4xl": typeLineHeight(fontSizeScale["4xl"], 1.15),
};

const iconSizeScale = {
  sm: spaceScale[16],
  md: spaceScale[24],
  lg: spaceScale[32],
};

const controlSizeScale = {
  sm: spaceScale[32],
  md: spaceScale[40],
  lg: spaceScale[48],
  touch: 44,
};

const durationScale = {
  micro: 100,
  fast: 150,
  normal: 200,
  slow: 300,
  overlay: 400,
};

const opacityScale = {
  disabled: 0.38,
  loading: 0.48,
  scrim: 0.4,
};

const zIndexScale = {
  base: 0,
  raised: 10,
  sticky: 20,
  overlay: 30,
  dialog: 40,
  popover: 50,
  toast: 60,
  critical: 70,
};

const easingScale = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  emphasized: "cubic-bezier(0.05, 0.7, 0.1, 1)",
  enter: "cubic-bezier(0, 0, 0, 1)",
  exit: "cubic-bezier(0.3, 0, 1, 1)",
};

const primitives = {
  space: spaceScale,
  radius: radiusScale,
  borderWidth: borderWidthScale,
  elevation: elevationScale,
  fontSize: fontSizeScale,
  lineHeight: lineHeightScale,
  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  iconSize: iconSizeScale,
  controlSize: controlSizeScale,
  duration: durationScale,
  easing: easingScale,
  opacity: opacityScale,
  zIndex: zIndexScale,
};

module.exports = {
  SPACE_MINI_UNIT,
  SPACE_BASE_UNIT,
  TYPE_BASE_SIZE,
  TYPE_SCALE_RATIO,
  space,
  snapToMiniUnit,
  snapToBaseUnit,
  typeSize,
  primitives,
};
