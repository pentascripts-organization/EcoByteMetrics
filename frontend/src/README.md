# Frontend source layout

The active application starts in `main.tsx` and is composed in `app/`.
Feature code belongs in `features/<feature>/`; reusable code shared by multiple
features belongs in `shared/`.

The root folders `components/`, `contexts/`, `hooks/`, `providers/`, `services/`,
`utils/`, `home/`, and `data/` are legacy compatibility code. Some files remain
referenced by older specs and are retained until those specs and their coverage
are migrated. New app and feature code must not import from these folders.
ESLint enforces this boundary for feature modules.
