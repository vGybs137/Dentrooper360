const { primitives } = require("./primitives");
const { semantic } = require("./semantic");

function px(value) {
  return `${value}px`;
}

function ms(value) {
  return `${value}ms`;
}

function typeStyle(fontSize, lineHeight, fontWeight) {
  return [px(fontSize), { lineHeight: px(lineHeight), fontWeight }];
}

const nativewindTheme = {
  spacing: {
    0: px(primitives.space[0]),
    px: px(1),
    0.5: px(primitives.space[2]),
    1: px(primitives.space[4]),
    2: px(primitives.space[8]),
    3: px(primitives.space[12]),
    4: px(primitives.space[16]),
    6: px(primitives.space[24]),
    8: px(primitives.space[32]),
    10: px(primitives.space[40]),
    12: px(primitives.space[48]),
    16: px(primitives.space[64]),
    20: px(primitives.space[80]),
    "inset-compact": px(semantic.space.inset.compact),
    inset: px(semantic.space.inset.default),
    "inset-comfortable": px(semantic.space.inset.comfortable),
    "stack-compact": px(semantic.space.stack.compact),
    stack: px(semantic.space.stack.default),
    "stack-comfortable": px(semantic.space.stack.comfortable),
    "gap-compact": px(semantic.space.gap.compact),
    gap: px(semantic.space.gap.default),
    "gap-comfortable": px(semantic.space.gap.comfortable),
    "inline-compact": px(semantic.space.inline.compact),
    inline: px(semantic.space.inline.default),
    "inline-comfortable": px(semantic.space.inline.comfortable),
    section: px(semantic.space.section),
    page: px(semantic.space.page),
  },
  borderRadius: {
    none: px(primitives.radius.none),
    xs: px(primitives.radius.xs),
    sm: px(primitives.radius.sm),
    md: px(primitives.radius.md),
    lg: px(primitives.radius.lg),
    xl: px(primitives.radius.xl),
    "2xl": px(primitives.radius["2xl"]),
    full: px(primitives.radius.full),
    control: px(semantic.radius.control),
    card: px(semantic.radius.card),
    overlay: px(semantic.radius.overlay),
    dialog: px(semantic.radius.dialog),
    pill: px(semantic.radius.pill),
  },
  borderWidth: {
    DEFAULT: px(primitives.borderWidth.DEFAULT),
    0: px(primitives.borderWidth.none),
    2: px(primitives.borderWidth[2]),
    4: px(primitives.borderWidth[4]),
    subtle: px(semantic.borderWidth.subtle),
    strong: px(semantic.borderWidth.strong),
    focus: px(semantic.borderWidth.focus),
  },
  boxShadow: {
    none: semantic.shadow.flat,
    raised: semantic.shadow.raised,
    overlay: semantic.shadow.overlay,
    dialog: semantic.shadow.dialog,
    popover: semantic.shadow.popover,
    critical: semantic.shadow.critical,
  },
  zIndex: {
    0: String(semantic.zIndex.flat),
    raised: String(semantic.zIndex.raised),
    sticky: String(semantic.zIndex.sticky),
    overlay: String(semantic.zIndex.overlay),
    dialog: String(semantic.zIndex.dialog),
    popover: String(semantic.zIndex.popover),
    toast: String(semantic.zIndex.toast),
    critical: String(semantic.zIndex.critical),
  },
  fontSize: {
    xs: typeStyle(primitives.fontSize.xs, primitives.lineHeight.xs, primitives.fontWeight.regular),
    sm: typeStyle(primitives.fontSize.sm, primitives.lineHeight.sm, primitives.fontWeight.regular),
    base: typeStyle(primitives.fontSize.md, primitives.lineHeight.md, primitives.fontWeight.regular),
    lg: typeStyle(primitives.fontSize.lg, primitives.lineHeight.lg, primitives.fontWeight.regular),
    xl: typeStyle(primitives.fontSize.xl, primitives.lineHeight.xl, primitives.fontWeight.semibold),
    "2xl": typeStyle(primitives.fontSize["2xl"], primitives.lineHeight["2xl"], primitives.fontWeight.bold),
    "3xl": typeStyle(primitives.fontSize["3xl"], primitives.lineHeight["3xl"], primitives.fontWeight.bold),
    "4xl": typeStyle(primitives.fontSize["4xl"], primitives.lineHeight["4xl"], primitives.fontWeight.bold),
    label: typeStyle(semantic.type.label.fontSize, semantic.type.label.lineHeight, semantic.type.label.fontWeight),
    body: typeStyle(semantic.type.body.fontSize, semantic.type.body.lineHeight, semantic.type.body.fontWeight),
    title: typeStyle(semantic.type.title.fontSize, semantic.type.title.lineHeight, semantic.type.title.fontWeight),
    display: typeStyle(semantic.type.display.fontSize, semantic.type.display.lineHeight, semantic.type.display.fontWeight),
  },
  fontWeight: primitives.fontWeight,
  minHeight: {
    control: px(semantic.size.control),
    "control-sm": px(semantic.size["control-sm"]),
    "control-lg": px(semantic.size["control-lg"]),
    touch: px(semantic.size.touch),
  },
  height: {
    control: px(semantic.size.control),
    "control-sm": px(semantic.size["control-sm"]),
    "control-lg": px(semantic.size["control-lg"]),
    touch: px(semantic.size.touch),
  },
  width: {
    icon: px(semantic.size.icon),
    "icon-sm": px(semantic.size["icon-sm"]),
    "icon-lg": px(semantic.size["icon-lg"]),
  },
  size: {
    icon: px(semantic.size.icon),
    "icon-sm": px(semantic.size["icon-sm"]),
    "icon-lg": px(semantic.size["icon-lg"]),
    control: px(semantic.size.control),
    "control-sm": px(semantic.size["control-sm"]),
    "control-lg": px(semantic.size["control-lg"]),
    touch: px(semantic.size.touch),
  },
  opacity: {
    disabled: String(semantic.opacity.disabled),
    loading: String(semantic.opacity.loading),
    scrim: String(semantic.opacity.scrim),
  },
  transitionDuration: {
    micro: ms(semantic.motion.micro.duration),
    fast: ms(semantic.motion.fast.duration),
    DEFAULT: ms(semantic.motion.normal.duration),
    enter: ms(semantic.motion.enter.duration),
    exit: ms(semantic.motion.exit.duration),
    overlay: ms(semantic.motion.overlay.duration),
  },
  transitionTimingFunction: {
    DEFAULT: semantic.motion.normal.easing,
    emphasized: primitives.easing.emphasized,
    enter: semantic.motion.enter.easing,
    exit: semantic.motion.exit.easing,
  },
  colors: {
    surface: semantic.color.surface,
    foreground: semantic.color.foreground,
    border: semantic.color.border,
    brand: semantic.color.brand,
    accent: semantic.color.accent,
    success: semantic.color.success,
    alert: semantic.color.alert,
  },
};

module.exports = { nativewindTheme };
