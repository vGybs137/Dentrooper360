# App security module

Canonical client security surface for Dentrooper360 (iOS/Android).

## Layout

| Path | Responsibility |
|------|----------------|
| `vault/` | SecureStore wrappers + device-only refresh token vault |
| `session/` | Session vault facade + token recycle/restore |
| `pairing/` | Device id + paired `customerId` + device API keys |
| `gates/` | Auth gate predicates for route protection |
| `biometric/` | Opt-in app lock and fingerprint sign-in. Not a token vault. |
| `clinicSwitch/` | Re-exports switch orchestrator |

Auth HTTP lives in `api/functions/auth.ts`. Session mappers/persist helpers live in
`helpers/auth/auth.ts`. Prefer `@/security` for gates, vault, app lock, and pairing.

## Token policy

- Access token: **memory only**
- Refresh token: device-only SecureStore; memory-cached after restore. Never behind `requireAuthentication` (a read would prompt on every token recycle).
- App lock: local biometric or device-passcode gate over the UI. Cancelling does not clear the refresh token.
- Fingerprint sign-in: after a password login, a later cold start can restore the saved session with a fingerprint. Cancelling falls back to the password form and does not clear the refresh token.
- Privacy shield: native app-switcher protection for the whole app (`expo-screen-capture`), plus a full-screen cover while inactive.
- Pairing API key: device-bound SecureStore
- Persist blob never stores access or refresh tokens

## RBAC (Phase 8)

- JWT carries `role`, `sync_scope`, `scope_version` (and `account_id` when known)
- `rbac/authRole.ts` exposes UI helpers (`useAuthRole`, `useSyncScope`, `matchUiRole`) — presentation only
- Server membership + `ISyncAuthorizationService` remain the source of truth for sync/authz
