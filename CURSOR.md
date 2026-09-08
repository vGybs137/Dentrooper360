READ @AGENTS.md BEFORE STARTING TO CODE.

# Naming conventions

Use these conventions for all new frontend code in this project.

## Folders

- Use **camelCase** for multi-word folders (`patientDetails/`, `monthView/`, `addPatient/`). Do not mass-rename existing folders to kebab-case.
- Use a **plural** name when a folder may hold many files of the same kind, each for a different usage (`stores/`, `types/`, `types/apis/`, `database/models/`).
- Keep `src/api` singular. It is the HTTP client module, not a collection of APIs.
- Expo Router keeps `src/app/` thin: route files re-export screens from `src/components/{domain}/`. Appointments routes live under `src/app/appointments/` while UI lives under `src/components/schedule/` (historical path asymmetry — intentional).
- Place hooks under `src/hooks/{domain}/` matching the business area (`patients/`, `payments/`, `recalls/`, `schedule/`, `auth/`, `sync/`, `ui/`, `data/`). Do not leave new hooks at the `hooks/` root.
- Place shared non-React helpers under `src/helpers/{domain}/` with the same domains (`patients/`, `payments/`, `recalls/`, `schedule/`, `auth/`, `sync/`, `ui/`, `api/`). Calendar math lives in `helpers/schedule/calendar/`. Do not add a separate `utils/` tree.

## Files

- React components: PascalCase (`UserProfile.tsx`).
- Utility modules: camelCase (`httpClient.ts`, `tokenStore.ts`).
- Match a PascalCase filename to a PascalCase export when the file is a component or model class (`Patient.ts`).

## Identifiers

- Variables and functions: camelCase (`isLoading`, `httpClient`).
- Event handlers: prefix with `handle` or `on` (`handleSubmit`, `onPress`).
- Global constants and enum values: UPPER_SNAKE_CASE (`API_BASE_URL`, `API_TIMEOUT_MS`).
- Custom hooks: `use` + camelCase (`useAuth`).
