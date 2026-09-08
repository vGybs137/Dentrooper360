export const qrCodeIcon = {
  ios: "qrcode",
  android: "qr_code_2",
  web: "qr_code_2",
} as const;

export const checkCircleIcon = {
  ios: "checkmark.circle.fill",
  android: "check_circle",
  web: "check_circle",
} as const;

export const warningIcon = {
  ios: "exclamationmark.triangle.fill",
  android: "warning",
  web: "warning",
} as const;

export const infoIcon = {
  ios: "info.circle.fill",
  android: "info",
  web: "info",
} as const;

export const personIcon = {
  ios: "person.crop.circle",
  android: "account_circle",
  web: "account_circle",
} as const;

export const lockIcon = {
  ios: "lock.fill",
  android: "lock",
  web: "lock",
} as const;

export function visibilityIcon(isVisible: boolean) {
  return isVisible
    ? ({
        ios: "eye.slash",
        android: "visibility_off",
        web: "visibility_off",
      } as const)
    : ({
        ios: "eye",
        android: "visibility",
        web: "visibility",
      } as const);
}

export const searchIcon = {
  ios: "magnifyingglass",
  android: "search",
  web: "search",
} as const;

export const clockIcon = {
  ios: "clock",
  android: "schedule",
  web: "schedule",
} as const;

export const locationIcon = {
  ios: "mappin.and.ellipse",
  android: "location_on",
  web: "location_on",
} as const;

export const notesIcon = {
  ios: "note.text",
  android: "notes",
  web: "notes",
} as const;

export const chevronDownIcon = {
  ios: "chevron.down",
  android: "expand_more",
  web: "expand_more",
} as const;

export const chevronLeftIcon = {
  ios: "chevron.left",
  android: "chevron_left",
  web: "chevron_left",
} as const;

export const chevronUpIcon = {
  ios: "chevron.up",
  android: "expand_less",
  web: "expand_less",
} as const;

export function chevronDisclosureIcon(expanded: boolean) {
  return expanded ? chevronUpIcon : chevronDownIcon;
}

export const starIcon = {
  ios: "star.fill",
  android: "star",
  web: "star",
} as const;

export const personAddIcon = {
  ios: "person.badge.plus",
  android: "person_add",
  web: "person_add",
} as const;

export const syncIcon = {
  ios: "arrow.triangle.2.circlepath",
  android: "sync",
  web: "sync",
} as const;

export const wifiIcon = {
  ios: "wifi",
  android: "wifi",
  web: "wifi",
} as const;

export const wifiOffIcon = {
  ios: "wifi.slash",
  android: "wifi_off",
  web: "wifi_off",
} as const;

export const closeIcon = {
  ios: "xmark",
  android: "close",
  web: "close",
} as const;

export const calendarIcon = {
  ios: "calendar",
  android: "calendar_month",
  web: "calendar_month",
} as const;

export const addAppointmentIcon = {
  ios: "calendar.badge.plus",
  android: "calendar_add_on",
  web: "calendar_add_on",
} as const;

export const editIcon = {
  ios: "pencil",
  android: "edit",
  web: "edit",
} as const;

export const deleteIcon = {
  ios: "trash",
  android: "delete",
  web: "delete",
} as const;

export const weekStartIcon = {
  ios: "calendar.badge.clock",
  android: "date_range",
  web: "date_range",
} as const;

export const pendingChangesIcon = {
  ios: "tray.full",
  android: "inbox",
  web: "inbox",
} as const;

export const appearanceIcon = {
  ios: "circle.lefthalf.filled",
  android: "contrast",
  web: "contrast",
} as const;

export const logoutIcon = {
  ios: "rectangle.portrait.and.arrow.right",
  android: "logout",
  web: "logout",
} as const;

export const ellipsisIcon = {
  ios: "ellipsis",
  android: "more_vert",
  web: "more_vert",
} as const;

export const phoneIcon = {
  ios: "phone.fill",
  android: "phone",
  web: "phone",
} as const;

export const messageIcon = {
  ios: "message.fill",
  android: "chat",
  web: "chat",
} as const;

export const emailIcon = {
  ios: "envelope.fill",
  android: "email",
  web: "email",
} as const;

export const addressIcon = {
  ios: "house.fill",
  android: "home",
  web: "home",
} as const;

export const ageIcon = {
  ios: "number",
  android: "pin",
  web: "pin",
} as const;

export const personsIcon = {
  ios: "person.2.fill",
  android: "group",
  web: "group",
} as const;

export const genderIcon = {
  ios: "person.crop.circle.fill",
  android: "wc",
  web: "wc",
} as const;

export const balanceIcon = {
  ios: "dollarsign.circle.fill",
  android: "payments",
  web: "payments",
} as const;
