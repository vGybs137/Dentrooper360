# App security module

Canonical client security surface for Dentrooper360 (iOS/Android).

`helpers/auth/*` and `api/functions/auth.ts` re-export from here so existing
imports keep working while later phases move implementations in.

## Layout

| Path | Responsibility |
|------|----------------|
| `vault/` | SecureStore wrappers + biometric-bound refresh token vault |
| `session/` | Session vault facade over auth store + token recycle/unlock |
| `pairing/` | Device id + paired `customerId` helpers |
| `gates/` | Auth gate predicates for route protection |
| `biometric/` | Biometric unlock + vault flush |
| `clinicSwitch/` | Multi-clinic switch orchestrator entry |
| `api/` | Auth HTTP API client |
| `sync/` | Mobile sync modes (JWT full clinical only) |

## Token policy

- Access token: **memory only** (never in SecureStore / persist blob)
- Refresh token: SecureStore with `requireAuthentication` + `WHEN_UNLOCKED_THIS_DEVICE_ONLY` when biometrics are enrolled; memory-cached after unlock/login
- Pairing API key: device-bound SecureStore
- Production web: token/secret storage unsupported

## Cold start

1. Hydrate paired `customerId` + user metadata (no tokens)
2. If `hasRefreshCredential` → biometric SecureStore read → refresh access JWT
3. Else → password login
4. Protected `(tabs)` / detail layouts use `AuthGate`
