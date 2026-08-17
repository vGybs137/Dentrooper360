import type { AuthUser } from "./authUser";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  user: AuthUser;
};
