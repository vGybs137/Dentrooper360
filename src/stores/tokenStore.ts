import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants/storage";
import { getItem, setItem } from "@/helpers/secureStorage";

export const tokenStore = {
  getAccessToken(): Promise<string | null> {
    return getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken(token: string | null): Promise<void> {
    return setItem(ACCESS_TOKEN_KEY, token);
  },
  getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token: string | null): Promise<void> {
    return setItem(REFRESH_TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, null),
      setItem(REFRESH_TOKEN_KEY, null),
    ]);
  },
};
