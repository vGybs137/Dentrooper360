export const semantic: {
  space: {
    inset: { compact: number; default: number; comfortable: number };
    stack: { compact: number; default: number; comfortable: number };
    gap: { compact: number; default: number; comfortable: number };
    inline: { compact: number; default: number; comfortable: number };
    section: number;
    page: number;
  };
  radius: {
    control: number;
    card: number;
    overlay: number;
    dialog: number;
    pill: number;
  };
  borderWidth: {
    subtle: number;
    strong: number;
    focus: number;
  };
  elevation: {
    flat: number;
    raised: number;
    overlay: number;
    dialog: number;
    popover: number;
    critical: number;
  };
  shadow: {
    flat: string;
    raised: string;
    overlay: string;
    dialog: string;
    popover: string;
    critical: string;
  };
  zIndex: {
    flat: number;
    raised: number;
    sticky: number;
    overlay: number;
    dialog: number;
    popover: number;
    toast: number;
    critical: number;
  };
  size: {
    icon: number;
    "icon-sm": number;
    "icon-lg": number;
    control: number;
    "control-sm": number;
    "control-lg": number;
    touch: number;
  };
  type: {
    label: { fontSize: number; lineHeight: number; fontWeight: string };
    body: { fontSize: number; lineHeight: number; fontWeight: string };
    title: { fontSize: number; lineHeight: number; fontWeight: string };
    display: { fontSize: number; lineHeight: number; fontWeight: string };
  };
  motion: {
    micro: { duration: number; easing: string };
    fast: { duration: number; easing: string };
    normal: { duration: number; easing: string };
    enter: { duration: number; easing: string };
    exit: { duration: number; easing: string };
    overlay: { duration: number; easing: string };
  };
  opacity: {
    disabled: number;
    loading: number;
    scrim: number;
  };
  color: {
    surface: {
      default: string;
      sunken: string;
      raised: string;
      overlay: string;
      inverse: string;
    };
    foreground: {
      default: string;
      muted: string;
      inverse: string;
    };
    border: {
      subtle: string;
      default: string;
      strong: string;
      focus: string;
    };
    brand: {
      default: string;
      subtle: string;
      strong: string;
      text: string;
    };
    accent: {
      default: string;
      subtle: string;
      strong: string;
      text: string;
    };
    success: {
      DEFAULT: string;
      subtle: string;
      strong: string;
      text: string;
    };
    alert: {
      DEFAULT: string;
      subtle: string;
      strong: string;
      text: string;
    };
  };
};
