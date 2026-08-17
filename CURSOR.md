@AGENTS.md

# Naming conventions

Use these conventions for all new frontend code in this project.

## Folders

- Use kebab-case for multi-word folders (`user-profile/`).
- Use a **plural** name when a folder may hold many files of the same kind, each for a different usage (`stores/`, `types/`, `types/apis/`, `database/models/`).
- Keep `src/api` singular. It is the HTTP client module, not a collection of APIs.

## Files

- React components: PascalCase (`UserProfile.tsx`).
- Utility modules: camelCase (`httpClient.ts`, `tokenStore.ts`).
- Match a PascalCase filename to a PascalCase export when the file is a component or model class (`Patient.ts`).

## Identifiers

- Variables and functions: camelCase (`isLoading`, `httpClient`).
- Event handlers: prefix with `handle` or `on` (`handleSubmit`, `onPress`).
- Global constants and enum values: UPPER_SNAKE_CASE (`API_BASE_URL`, `API_TIMEOUT_MS`).
- Custom hooks: `use` + camelCase (`useAuth`).
