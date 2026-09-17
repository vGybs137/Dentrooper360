import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

function isNative(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/**
 * True when the OS can authenticate the device owner (biometrics or passcode).
 * Web never prompts. No session side effects.
 */
export async function canUseDeviceAuth(): Promise<boolean> {
  if (!isNative()) {
    return false;
  }

  try {
    const [hasHardware, enrolled, level] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.getEnrolledLevelAsync(),
    ]);
    const passcodeOrBetter = level >= LocalAuthentication.SecurityLevel.SECRET;
    return (hasHardware && enrolled) || passcodeOrBetter;
  } catch {
    return false;
  }
}

/** Settings toggle: biometrics must be enrolled. Passcode-only devices stay hidden. */
export async function canOfferBiometricLock(): Promise<boolean> {
  if (!isNative()) {
    return false;
  }

  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

/**
 * Face ID, fingerprint, or device passcode. Does not read or write tokens.
 * Android accepts Class 3 biometrics only; the OS passcode remains the fallback.
 */
export async function authenticateDeviceOwner(
  promptMessage: string,
): Promise<boolean> {
  if (!isNative()) {
    return false;
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      biometricsSecurityLevel: "strong",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
