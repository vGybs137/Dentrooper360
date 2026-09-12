import { Platform } from "react-native";

export const BOTTOM_TAB_INSET =
  Platform.select({
    ios: 50,
    android: 80,
    web: 80,
    default: 80,
  }) ?? 80;

export function getWebTabBarInset(rootSegment: string | undefined) {
  return Platform.OS === "web" && rootSegment === "(tabs)"
    ? BOTTOM_TAB_INSET
    : 0;
}

export type AppTabName =
  | "schedule"
  | "patients"
  | "payments"
  | "recalls"
  | "settings";

export type AppTabDefinition = {
  name: AppTabName;
  labelKey: `navigation:tabs.${AppTabName}`;
  href: `/(tabs)/${string}`;
  sf: { default: string; selected: string };
  md: string;
};

export const APP_TABS = [
  {
    name: "schedule",
    labelKey: "navigation:tabs.schedule",
    href: "/(tabs)/schedule",
    sf: { default: "calendar", selected: "calendar" },
    md: "event",
  },
  {
    name: "patients",
    labelKey: "navigation:tabs.patients",
    href: "/(tabs)/patients",
    sf: { default: "person.2", selected: "person.2.fill" },
    md: "group",
  },
  {
    name: "payments",
    labelKey: "navigation:tabs.payments",
    href: "/(tabs)/payments",
    sf: { default: "creditcard", selected: "creditcard.fill" },
    md: "payments",
  },
  {
    name: "recalls",
    labelKey: "navigation:tabs.recalls",
    href: "/(tabs)/recalls",
    sf: { default: "phone", selected: "phone.fill" },
    md: "phone",
  },
  {
    name: "settings",
    labelKey: "navigation:tabs.settings",
    href: "/(tabs)/settings",
    sf: { default: "gearshape", selected: "gearshape.fill" },
    md: "settings",
  },
] as const satisfies readonly AppTabDefinition[];
