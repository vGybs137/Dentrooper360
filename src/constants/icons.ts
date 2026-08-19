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
