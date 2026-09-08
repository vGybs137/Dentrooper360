export function parseRouteFlag(
  value: string | string[] | undefined,
  flag: string,
): boolean {
  return value === flag || value?.[0] === flag;
}

export function isIntroFromSplash(
  intro: string | string[] | undefined,
): boolean {
  return parseRouteFlag(intro, "1");
}

export function isFromOnboarding(
  from: string | string[] | undefined,
): boolean {
  return parseRouteFlag(from, "onboarding");
}
