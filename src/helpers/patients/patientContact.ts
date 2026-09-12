import { Alert, Linking } from "react-native";

import { t } from "@/i18n";

/** Digits-only E.164-style number (country code + national number, no +). */
export function patientPhoneDigits(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
): string | null {
  const digits = [countryCode, phoneNumber]
    .filter(Boolean)
    .join("")
    .replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function patientWhatsAppUrl(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
): string | null {
  const digits = patientPhoneDigits(countryCode, phoneNumber);
  return digits ? `https://wa.me/${digits}` : null;
}

/** Opens the phone app and dials the patient number. */
export function patientCallUrl(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
): string | null {
  const digits = patientPhoneDigits(countryCode, phoneNumber);
  if (!digits) {
    return null;
  }

  return `tel:+${digits}`;
}

function alertMissingPhone() {
  Alert.alert(
    t("patients:contact.noPhoneTitle"),
    t("patients:contact.noPhoneMessage"),
  );
}

export async function openPatientWhatsApp(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
): Promise<void> {
  const url = patientWhatsAppUrl(countryCode, phoneNumber);
  if (!url) {
    alertMissingPhone();
    return;
  }

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      t("patients:contact.whatsappError"),
      t("errors:generic.pleaseTryAgain"),
    );
  }
}

export async function openPatientPhoneCall(
  countryCode: string | null | undefined,
  phoneNumber: string | null | undefined,
): Promise<void> {
  const url = patientCallUrl(countryCode, phoneNumber);
  if (!url) {
    alertMissingPhone();
    return;
  }

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      t("patients:contact.callError"),
      t("errors:generic.pleaseTryAgain"),
    );
  }
}
