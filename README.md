# MediQueue Frontend

The Sinhala-first public website and authentication experience for MediQueue.

**Owner: ChamathDilshanC**

## Run locally

Requires Node.js 20.9+ and npm.

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open <http://127.0.0.1:3000>. The server-side API adapter defaults to the existing
MediQueue deployment. Set `MEDIQUEUE_API_URL` in `.env.local` to use another backend.
No Supabase service key or database credentials belong in this application.

## Included

- Responsive landing page, animated queue illustration, feature sections and FAQ.
- Sinhala by default, with a persistent Sinhala / English dropdown on every page.
- Local `tharu_digital_mahee.ttf` for Sinhala glyphs and bundled Poppins for Latin.
- Brand logo in navigation, browser icons, Apple icon and Open Graph metadata.
- Login, registration, email confirmation feedback, recovery request, new-password
  screen, authenticated account details and sign-out.
- Google sign-in on login/register, using server-side PKCE code exchange.
- `goey-toast` notifications and the `Dual` loader from `loading-dev` at size 48.
- Framer Motion with reduced-motion support and keyboard-accessible forms/navigation.
- Magic UI's Animated Shiny Text, selected from the 21st.dev community catalogue.

The queue card is explicitly an **illustration**, not a live queue. Patient booking,
reception/admin/doctor workspaces and live queue screens remain future slices.
The account screen shows only the profile and memberships returned by the backend.

## Language and fonts

`src/lib/translations.ts` contains type-checked Sinhala and English messages.
`mq_language` stores only the language preference; the server uses it to render
with the correct document language without a flash of English.

No translation API is needed for these fixed UI messages. This keeps the site
usable without translation credentials and avoids sending account data to a
third-party translation service. Add future UI copy to both dictionaries.

The requested Sinhala font is copied into `public/fonts`. Its Unicode range is
restricted to Sinhala so its decorative Latin glyphs do not replace Poppins.
Fonts are served locally; Google Fonts is not requested at runtime.

## Authentication

Browser forms call same-origin Next.js route handlers under `/api/auth/*`, which
call the existing versioned backend `/v1/auth/*` endpoints. Runtime Zod contracts
match `backend/backend/schemas.py`. Raw upstream errors and access/refresh tokens
are never returned in browser JSON or logged.

Session tokens use HttpOnly, SameSite=Lax cookies; production also uses Secure.
Mutating requests validate Origin. Access expiry triggers refresh-token rotation
when reading the profile. Sign-out clears local cookies even if the upstream
revocation service is unavailable, and explains that case to the user.

Google login uses `POST /api/auth/google` to create a random PKCE verifier in a
10-minute HttpOnly cookie. Supabase handles Google's consent flow and returns to
`/auth/callback`. The callback exchanges the code with Supabase Auth and sets the
same session cookies used by email login. The browser never receives provider or
session tokens in JSON; backend membership checks still determine access.

Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local` and the deployed
frontend environment, using the same project as the backend. No Google client
secret or Supabase service-role key is needed in this frontend. Enable the Google
provider and store Google's client ID/secret in Supabase. Add these exact frontend
redirects to Supabase's allowed redirect URLs:

- `http://127.0.0.1:3000/auth/callback`
- `http://localhost:3000/auth/callback`
- `https://your-frontend-domain/auth/callback`

Google Cloud's authorized redirect URI is the Supabase callback URL
`https://your-project.supabase.co/auth/v1/callback`, not the frontend callback.
Reference: [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google).

### Signup rate limits

HTTP 429 means Supabase temporarily limited an authentication/email request.
The UI preserves `Retry-After` when provided, disables repeated email submits
for that interval (60 seconds as a UI cooldown when unspecified), and leaves
Google available. The countdown is a retry cooldown, not a guarantee that the
provider quota resets then. Backend updates preserve 429 for password login
and expose only allowlisted provider error codes; deploy the backend update
to get specific email-quota diagnostics rather than the generic fallback.

The built-in Supabase email service currently allows only two emails per hour
per project. Configure custom SMTP or a Send Email hook and appropriate limits
for real signup traffic. Do not disable email verification to work around this.
The screenshot's original generic response cannot establish which quota was hit.
Reference: [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits).

For deployment:

1. Set `MEDIQUEUE_API_URL` to the backend URL.
2. Set `APP_ORIGIN` to the exact frontend origin, without a trailing slash. This
   is used for Origin validation and absolute social metadata URLs. Vercel's
   production URL is also recognized for metadata when `APP_ORIGIN` is omitted.
3. Configure Supabase's Site URL and allowed redirect URLs for this frontend.
   Email recovery may land on `/reset-password` or the site root: root recovery
   fragments are redirected to `/reset-password`, removed from the address bar,
   and exchanged server-side for cookies. This REST facade uses implicit email
   links; custom PKCE or `token_hash` email templates need a separate callback.
4. Configure Supabase email delivery/confirmation and verify with a real test
   account in staging. Automated tests use fixtures and do not send real emails.
5. Run `npm run build`, then deploy the `frontend` submodule as the Next.js root.

## Checks

```powershell
npm run typecheck
npm run format:check
npm run build
npx playwright install chromium
npm test
```

Playwright starts a production frontend on port 3100 and a deterministic mock
identity API on port 4100. Tests cover language persistence, mobile overflow,
metadata, validation, recovery, loading, errors, HttpOnly cookies, origin checks,
refresh rotation and logout. Tests never mutate the live backend.

Preview screenshots are written under ignored `test-results/`. Successful live
authentication still requires backend/Supabase configuration and valid credentials.

## Component source

Navigation uses starc007's Animated Sidebar for the dashboard/account desktop
rail and the mobile menu on every page, including authentication pages. All 13
resource links point to the existing dashboard API views. The 21st.dev install
endpoint required authentication; the component and its motion dependencies were
sourced from the same author's [public repository](https://github.com/starc007/ui-components/tree/main/components/motion).
Local adaptations cover MediQueue styling, labels, routes and mobile panel width.

The theme control is installed with `pnpm dlx shadcn@latest add
@magicui/animated-theme-toggler`. The shared provider preserves `mq_theme`,
synchronizes the Tailwind dark class and existing theme tokens, and initializes
before paint. Reduced motion and browsers without View Transitions switch themes
immediately. Third-party MIT notices are retained in `THIRD_PARTY_LICENSES.md`.

The [Animated Shiny Text component on 21st.dev](https://21st.dev/community/components/dillionverma/animated-shiny-text)
is sourced from the author's [official registry](https://magicui.design/r/animated-shiny-text.json).
The 21st.dev direct registry requires authentication, so the official open-source
distribution is used. Its MIT notice is retained in `THIRD_PARTY_LICENSES.md`.

See [repository rules](../docs/AGENTS.md) for architecture and contribution rules.
