# AGENTS.md — Security & Privacy Rules

Operative rules for any AI coding agent working in this repository.
**Read this before generating, modifying, or pushing code.**

These rules are mandatory, not optional. Flag risky code instead of silently proceeding.

---

## 1. Privacy & Data Handling

- Always check whether the application collects user data.
- If user data is collected:
  - Ensure a **Privacy Policy** exists at [`/pages/privacy/`](src/pages/privacy.njk) and is linked from the footer.
  - Clearly document **what data is collected and why** in the privacy page.
  - Identify **where user data is stored** (email inbox, third-party service, database).
  - Avoid collecting unnecessary personal information — every field on a form must justify its presence.
- Never expose sensitive user data in logs, analytics, or API responses.

## 2. Secrets & Environment Variables

- **Never** expose API keys, tokens, secrets, or credentials in frontend code (anything in `src/`, `assets/`, `_site/`).
- **Never** hardcode secrets in source files. Use `process.env.X` in serverless functions; `.env.example` documents what's needed but contains no real values.
- Ensure `.env`, `.env.local`, `.env.production` are listed in `.gitignore`.
- Move sensitive keys server-side or behind a secure proxy (`api/*` Vercel functions).
- Remove secrets from logs, error messages, and debug output before they reach users or persistent logs.
- Verify before commit: `git diff --staged | grep -E "(API_KEY|SECRET|TOKEN|PASSWORD|sk_|re_[a-z0-9])"` returns nothing.

## 3. API Security

- Check API responses for sensitive information leakage. APIs must **never** return:
  - passwords
  - tokens (including Turnstile internals, Resend response details)
  - internal database IDs or sequence numbers
  - stack traces
  - infrastructure details (file paths, host names, service versions)
  - raw database errors
- Add authentication and authorization checks to any endpoint that isn't deliberately public.
- Ensure secure session and token handling — `Secure`, `HttpOnly`, `SameSite=Lax|Strict` on cookies.
- Validate all input server-side, regardless of client-side validation.

## 4. OWASP Top-10 Review

Before pushing code, scan for:

- **A01 — Broken access control**: every protected route checks authz.
- **A02 — Cryptographic failures**: never custom-roll crypto; use libraries (Web Crypto, `crypto` module).
- **A03 — Injection** (SQL, NoSQL, command, XSS): parameterised queries, escape on output, validate on input.
- **A04 — Insecure design**: think attacker-first for every new flow.
- **A05 — Security misconfiguration**: review `vercel.json` headers, CSP, CORS.
- **A06 — Vulnerable components**: `npm audit` clean, dependencies pinned.
- **A07 — Identification & authentication failures**: rate-limit auth endpoints, no user-enumeration leaks.
- **A08 — Software & data integrity failures**: pinned versions, SRI on external scripts where applicable.
- **A09 — Security logging & monitoring failures**: log security events server-side; do not log secrets.
- **A10 — SSRF**: any URL-from-user-input is validated/allowlisted before fetch.

Use parameterised queries and proper input validation everywhere.

## 5. Security Headers & Infrastructure

Verify these headers in `vercel.json`:

- `Content-Security-Policy`
- `Strict-Transport-Security` (with `includeSubDomains; preload`)
- `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (deny camera/microphone/geolocation by default)

HTTPS must be enforced in production. Avoid `'unsafe-inline'` / `'unsafe-eval'` in script-src; if present, document the reason and the removal path.

## 6. Rate Limiting & Abuse Prevention

- Add rate limits to public APIs and any endpoint that emails / writes / consumes paid quotas.
- Protect authentication endpoints from brute force.
- Prevent abuse that could increase API or infrastructure costs (Resend, Turnstile, etc.).
- Honeypot fields + bot challenge (Turnstile/hCaptcha) on every public form.

## 7. Logging & Monitoring

- Never log:
  - passwords, password hashes
  - API keys, secrets
  - session IDs, JWTs
  - personally identifiable information (name + phone + email together)
  - request/response bodies that may contain the above
- Sanitise logs before they reach any external store.
- Disable verbose debug logging in production.

## 8. Required Pre-Commit / Pre-PR Mindset

Before creating a PR or pushing code, an agent must:

1. **Review** for security vulnerabilities.
2. **Review** for privacy / data-exposure risks.
3. **Verify** secrets are protected and not in the diff.
4. **Verify** authentication / authorization logic.
5. **Check** for unsafe API responses.
6. **Confirm** rate limiting exists where needed.
7. **Flag** risky code in the PR description rather than silently proceeding.

---

## Project-specific notes (Siliguri Security Services)

- The site is a **static Eleventy build deployed to Vercel** with a small number of `api/*` serverless functions.
- The only user data collected is **lead-form data**: name, phone (mandatory), email (optional), location, role/service, free-text notes. Data is sent via **Resend** to a notification email; no database is used.
- Auto-reply emails to candidates / prospects must not leak any data other than what they themselves submitted.
- Privacy Policy: [src/pages/privacy.njk](src/pages/privacy.njk) — keep it in sync when form fields change.
- Anti-spam: Cloudflare **Turnstile** (sitekey gated by `site.turnstileSitekey`) + honeypot field `company_website` + server-side phone-format validation.
- All secrets live in **Vercel environment variables**: `RESEND_API_KEY`, `TURNSTILE_SECRET`, `LEAD_FROM_EMAIL`, `LEAD_NOTIFY_EMAIL`, `LEAD_CAREER_NOTIFY_EMAIL`. `.env.example` documents the names without values.
- The `CSP` in `vercel.json` is the source of truth — keep it as strict as possible; widen it only with a specific reason and revisit periodically.
- The career application flow shares the lead API but distinguishes via `formType: "career"`. Validation rules differ; never lump them.
