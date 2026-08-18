import { Platform } from "react-native";

export const BOTTOM_TAB_INSET =
  Platform.select({
    ios: 50,
    android: 80,
    web: 80,
    default: 80,
  }) ?? 80;

export type AppTabDefinition = {
  name: string;
  label: string;
  href: `/(tabs)/${string}`;
  sf: { default: string; selected: string };
  md: string;
};

export const APP_TABS = [
  {
    name: "schedule",
    label: "Schedule",
    href: "/(tabs)/schedule",
    sf: { default: "calendar", selected: "calendar" },
    md: "event",
  },
  {
    name: "patients",
    label: "Patients",
    href: "/(tabs)/patients",
    sf: { default: "person.2", selected: "person.2.fill" },
    md: "group",
  },
  {
    name: "payments",
    label: "Payments",
    href: "/(tabs)/payments",
    sf: { default: "creditcard", selected: "creditcard.fill" },
    md: "payments",
  },
  {
    name: "recalls",
    label: "Recalls",
    href: "/(tabs)/recalls",
    sf: { default: "phone", selected: "phone.fill" },
    md: "phone",
  },
  {
    name: "settings",
    label: "Settings",
    href: "/(tabs)/settings",
    sf: { default: "gearshape", selected: "gearshape.fill" },
    md: "settings",
  },
] as const satisfies readonly AppTabDefinition[];
