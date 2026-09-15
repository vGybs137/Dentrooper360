# App security module

Canonical client security surface for Dentrooper360 (iOS/Android).

## Layout

| Path | Responsibility |
|------|----------------|
| `vault/` | SecureStore wrappers + biometric-bound refresh token vault |
| `session/` | Session vault facade + token recycle/unlock |
| `pairing/` | Device id + paired `customerId` + device API keys |
| `gates/` | Auth gate predicates for route protection |
| `biometric/` | Biometric unlock + vault flush |
| `clinicSwitch/` | Re-exports switch orchestrator |

Auth HTTP lives in `api/functions/auth.ts`. Session mappers/persist helpers live in
`helpers/auth/auth.ts`. Prefer `@/security` for gates, vault, biometric, and pairing.

## Token policy

- Access token: **memory only**
- Refresh token: SecureStore with biometric when enrolled; memory-cached after unlock
- Pairing API key: device-bound SecureStore
- Persist blob never stores access or refresh tokens
