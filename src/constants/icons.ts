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
