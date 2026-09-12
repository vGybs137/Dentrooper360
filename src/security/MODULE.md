# App security module

Canonical client security surface for Dentrooper360 (iOS/Android).

`helpers/auth/*` and `api/functions/auth.ts` re-export from here so existing
imports keep working while later phases move implementations in.

## Layout

| Path | Responsibility |
|------|----------------|
| `vault/` | SecureStore wrappers (Phase 5: biometric-bound refresh) |
| `session/` | Session vault facade over auth store + token recycle |
| `pairing/` | Device id + paired `customerId` helpers |
| `gates/` | Auth gate predicates for route protection (Phase 5) |
| `biometric/` | Biometric unlock seam (Phase 5) |
| `clinicSwitch/` | Multi-clinic switch orchestrator entry |
| `api/` | Auth HTTP API client |
| `sync/` | Bootstrap vs full clinical sync modes |

## Token policy (target)

- Access token: memory only (Phase 5)
- Refresh token: SecureStore + biometric (Phase 5)
- Pairing API key: device-bound SecureStore

Until Phase 5, session vault still persists both tokens via the existing auth store.
