# Claude Code Configuration - Markvision Auth Hub

## Behavioral Rules

- Do what has been asked; nothing more, nothing less
- ALWAYS prefer editing an existing file to creating a new one
- NEVER create documentation files unless explicitly requested
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files
- NEVER save working files or tests to the root folder

## File Organization

- `/src` — source code
- `/tests` — test files
- `/docs` — documentation
- `/scripts` — utility scripts

## Build & Test

```bash
npm run build
npm test
npm run lint
```

## Security

- NEVER hardcode API keys or secrets in source files
- NEVER commit .env files
- Validate user input at system boundaries

## Project Stack

- React + TypeScript + Vite + Tailwind + shadcn/ui
- Supabase (PostgreSQL) — backend
- Vercel — deployment
- n8n — workflow automation (https://n8n.zapoinov.com)
- RBAC roles: Admin, Manager, Doctor
