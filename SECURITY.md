# Security Policy

## Reporting a Vulnerability

If you discover a security issue in this repository, **do not open a public
issue**. Instead, email the maintainer directly:

- **Contact:** zapoinov95@gmail.com
- Please include a clear description, reproduction steps, and the potential
  impact. We aim to acknowledge reports within 72 hours.

## Supported Versions

Only the `main` branch is actively maintained. Forks and older branches are
unsupported.

## Threat Model & Mitigations

This is a multi-tenant SaaS CRM (Supabase + React SPA + Vercel serverless
functions + n8n workflows). The primary risks and controls:

| Risk | Control |
|---|---|
| Leaked secrets in git | `.gitignore` excludes `.env*` (except `.env.example`); no secrets in client bundle |
| Client-side key exposure | Only `VITE_SUPABASE_URL` and anon key are public; RLS enforces access |
| Service role key leak | Stored only in Vercel/Supabase env — never in `VITE_*`, never in client code, never in n8n JSON committed to git |
| Unauthorised DB access | Row-Level Security enabled on all tenant tables; policies scoped by `auth.uid()` / `project_members` |
| Unauthenticated API routes | Serverless endpoints in `/api` verify a shared token (`AI_EDIT_RENDER_TOKEN`) or Supabase JWT |
| Webhook spoofing (n8n / Instagram) | Signature verification on inbound webhooks; idempotency keys |
| XSS | React escapes by default; no `dangerouslySetInnerHTML` with user input |
| CSRF | Supabase auth via bearer token (no cookie-based sessions for API) |
| Dependency vulnerabilities | Dependabot enabled; `npm audit` in CI |

## Secret Hygiene — Rules

1. **Never** commit files containing:
   - Supabase `service_role` JWTs
   - OpenAI / Gemini / Anthropic API keys
   - Airtable PATs, Speechmatics keys, Instagram tokens
   - `.env`, `.env.local`, or any credential material
2. **`VITE_` prefix = PUBLIC.** Variables prefixed `VITE_` are inlined into the
   client bundle and visible to every visitor. Only expose:
   - Supabase URL + anon key (designed to be public, protected by RLS)
   - n8n webhook URLs that are idempotent or signature-verified
3. **Private keys live in Vercel env** (`Settings → Environment Variables`),
   consumed only by serverless routes under `/api` or by Supabase Edge
   Functions.
4. **Rotate immediately** if a key is suspected to be exposed. Supabase:
   `Project Settings → API → Generate new JWT secret` invalidates all existing
   JWTs.

## Incident Response

If a secret is exposed:

1. Rotate the key in the upstream provider (Supabase / OpenAI / etc.).
2. Update the Vercel environment variable with the new value.
3. Redeploy production.
4. Remove the secret from `HEAD` and purge it from git history
   (`git filter-repo --replace-text` or BFG), then force-push.
5. Notify affected users if data exposure is suspected.

## Row-Level Security Checklist

Every new table in `supabase/migrations/` MUST:

- [ ] Have `ENABLE ROW LEVEL SECURITY` set.
- [ ] Have explicit `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies (no default-allow).
- [ ] Scope policies to `auth.uid()` or `project_members.project_id`.
- [ ] Reject anonymous access unless the data is intentionally public.

See `supabase/migrations/*` for existing policy patterns.
