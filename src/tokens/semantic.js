const { primitives } = require("./primitives");

const semantic = {
  space: {
    inset: {
      compact: primitives.space[8],
      default: primitives.space[12],
      comfortable: primitives.space[16],
    },
    stack: {
      compact: primitives.space[4],
      default: primitives.space[8],
      comfortable: primitives.space[12],
    },
    gap: {
      compact: primitives.space[4],
      default: primitives.space[8],
      comfortable: primitives.space[12],
    },
    inline: {
      compact: primitives.space[8],
      default: primitives.space[12],
      comfortable: primitives.space[16],
    },
    section: primitives.space[24],
    page: primitives.space[16],
  },
  radius: {
    control: primitives.radius.sm,
    card: primitives.radius.md,
    overlay: primitives.radius.lg,
    dialog: primitives.radius.xl,
    pill: primitives.radius.full,
  },
  borderWidth: {
    subtle: primitives.borderWidth.DEFAULT,
    strong: primitives.borderWidth[2],
    focus: primitives.borderWidth[2],
  },
  elevation: {
    flat: primitives.elevation[0],
    raised: primitives.elevation[1],
    overlay: primitives.elevation[2],
    dialog: primitives.elevation[3],
    popover: primitives.elevation[4],
    critical: primitives.elevation[5],
  },
  shadow: {
    flat: "none",
    raised: "0 1px 2px 0 rgb(0 0 0 / 0.08)",
    overlay: "0 3px 8px 0 rgb(0 0 0 / 0.10)",
    dialog: "0 6px 16px 0 rgb(0 0 0 / 0.12)",
    popover: "0 8px 24px 0 rgb(0 0 0 / 0.14)",
    critical: "0 12px 32px 0 rgb(0 0 0 / 0.16)",
  },
  zIndex: {
    flat: primitives.zIndex.base,
    raised: primitives.zIndex.raised,
    sticky: primitives.zIndex.sticky,
    overlay: primitives.zIndex.overlay,
    dialog: primitives.zIndex.dialog,
    popover: primitives.zIndex.popover,
    toast: primitives.zIndex.toast,
    critical: primitives.zIndex.critical,
  },
  size: {
    icon: primitives.iconSize.md,
    "icon-sm": primitives.iconSize.sm,
    "icon-lg": primitives.iconSize.lg,
    control: primitives.controlSize.md,
    "control-sm": primitives.controlSize.sm,
    "control-lg": primitives.controlSize.lg,
    touch: primitives.controlSize.touch,
  },
  type: {
    label: {
      fontSize: primitives.fontSize.sm,
      lineHeight: primitives.lineHeight.sm,
      fontWeight: primitives.fontWeight.medium,
    },
    body: {
      fontSize: primitives.fontSize.md,
      lineHeight: primitives.lineHeight.md,
      fontWeight: primitives.fontWeight.regular,
    },
    title: {
      fontSize: primitives.fontSize.xl,
      lineHeight: primitives.lineHeight.xl,
      fontWeight: primitives.fontWeight.semibold,
    },
    display: {
      fontSize: primitives.fontSize["2xl"],
      lineHeight: primitives.lineHeight["2xl"],
      fontWeight: primitives.fontWeight.bold,
    },
  },
  motion: {
    micro: {
      duration: primitives.duration.micro,
      easing: primitives.easing.standard,
    },
    fast: {
      duration: primitives.duration.fast,
      easing: primitives.easing.standard,
    },
    normal: {
      duration: primitives.duration.normal,
      easing: primitives.easing.standard,
    },
    enter: {
      duration: primitives.duration.slow,
      easing: primitives.easing.enter,
    },
    exit: {
      duration: primitives.duration.fast,
      easing: primitives.easing.exit,
    },
    overlay: {
      duration: primitives.duration.overlay,
      easing: primitives.easing.emphasized,
    },
  },
  opacity: {
    disabled: primitives.opacity.disabled,
    loading: primitives.opacity.loading,
    scrim: primitives.opacity.scrim,
  },
  color: {
    surface: {
      default: "var(--surface-default)",
      sunken: "var(--surface-sunken)",
      raised: "var(--surface-raised)",
      overlay: "var(--surface-overlay)",
      inverse: "var(--surface-inverse)",
    },
    foreground: {
      default: "var(--foreground-default)",
      muted: "var(--foreground-muted)",
      inverse: "var(--foreground-inverse)",
    },
    border: {
      subtle: "var(--border-subtle)",
      default: "var(--border-default)",
      strong: "var(--border-strong)",
      focus: "var(--border-focus)",
    },
    brand: {
      default: "var(--brand-500)",
      subtle: "var(--brand-subtle)",
      strong: "var(--brand-700)",
      text: "var(--brand-text)",
    },
    accent: {
      default: "var(--accent-500)",
      subtle: "var(--accent-subtle)",
      strong: "var(--accent-700)",
      text: "var(--accent-text)",
    },
    success: {
      DEFAULT: "var(--success-500)",
      subtle: "var(--success-subtle)",
      strong: "var(--success-700)",
      text: "var(--success-text)",
    },
    alert: {
      DEFAULT: "var(--alert-500)",
      subtle: "var(--alert-subtle)",
      strong: "var(--alert-700)",
      text: "var(--alert-text)",
    },
  },
};

module.exports = { semantic };
