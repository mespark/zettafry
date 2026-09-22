<div align="center">

# Zettafry — Bills to Excel, instantly

**Upload a bill or receipt, get clean, structured Excel data back in minutes.**
An AI-powered invoice/bill extraction console with Google + email OTP auth, camera capture, bulk processing and an editable output table.

![License](https://img.shields.io/badge/license-MIT-2ea043?style=flat-square)
![React](https://img.shields.io/badge/React_19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![TanStack Start](https://img.shields.io/badge/TanStack-Start%20%2F%20Router-FF4154?style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

</div>

---

## Overview

Zettafry reads bills, receipts and invoices — typed, scanned or photographed — and turns them into structured data: invoice number, date, vendor, GST details, line items, quantities, prices, taxes and totals. Review and edit the extracted rows in-app, then export to Excel.

## Features

- **Multiple input methods**: upload a file, take a photo with the camera, or paste text
- **Bulk processing**: run a batch of bills through the pipeline in one go
- **Editable output table**: fix a misread field before exporting
- **Excel export** (`.xlsx`) with invoice and line-item sheets
- **Auth**: Google sign-in or a one-time email code (Firebase Auth on the client, Supabase for OTP + session)
- **Admin panel**: model status and usage, gated by a single admin email
- **Usage quota** enforced server-side per signed-in user

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19, TanStack Start, TanStack Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Auth | Firebase Auth (Google), Supabase Auth (email OTP) |
| Data | Supabase (Postgres) for usage/admin config |
| Spreadsheet export | `xlsx` |
| Server runtime | Nitro |
| Tooling | Vite, ESLint, Prettier, Bun |

## Project structure

```
src/
├── routes/              # File-based routes: /, /about, /services, /pricing,
│                         # /contact, /auth, /app (console), /admin, /privacy, /terms
├── components/site/     # Landing page and console UI (Nav, Footer, BrandMark, ...)
├── lib/
│   ├── firebase.ts              # Firebase client config (Google sign-in)
│   ├── supabase.ts               # Supabase client (browser)
│   ├── chat.server.ts            # AI extraction pipeline (server)
│   ├── chat.functions.ts         # Server functions the console calls
│   ├── usage.server.ts           # Quota + Firebase token verification
│   ├── admin-config.server.ts    # Admin auth + config (server)
│   └── excel.ts                  # Builds the .xlsx export
└── data/content.ts       # Marketing copy, pricing plans
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) and Node.js 20.19+ (or 22+)
- A [Firebase](https://console.firebase.google.com) project with **Google** sign-in enabled
- A [Supabase](https://supabase.com) project with **email OTP** sign-in enabled

### Setup

```bash
git clone https://github.com/mespark/zettafry.git
cd zettafry
bun install
cp .env.example .env
# fill in your Firebase and Supabase values, see the table below
bun run dev
```

The app runs at `http://localhost:3000`.

### Environment variables

See [`.env.example`](./.env.example) for the full list. Summary:

| Variable | Used by | Notes |
|---|---|---|
| `VITE_FIREBASE_*` | browser | Firebase web config, for Google sign-in |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | server only | Firebase Admin SDK, used to verify ID tokens. Never commit these |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | Supabase project URL and publishable (anon) key |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | server only | Used for usage tracking and admin config. The service role key must never be exposed to the browser |
| `HF_TOKEN`, `GROQ_API_KEY`, `GROQ_MODEL` | server only | Power the current AI extraction pipeline (shared key, server-side). Being migrated to a bring-your-own-key flow — see [Roadmap](#roadmap) |

### Admin access

The admin panel (`/admin`) is gated by a single email constant in `src/lib/models.ts` (`ADMIN_EMAIL`). Sign in with that address (via Google or the email OTP flow) to see it.

### Build and deploy

```bash
bun run build      # production build
bun run preview    # preview the build
```

Deploys to Vercel like any TanStack Start app: import the repo, add the environment variables above, and deploy. Variables starting with `VITE_` are embedded in the browser bundle, so Vercel does not allow marking them Sensitive; mark `FIREBASE_PRIVATE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as Sensitive.

## Roadmap

- **Bring-your-own-key AI**: replace the shared `HF_TOKEN` / `GROQ_API_KEY` pipeline with per-user Gemini / OpenRouter API keys, so each user's usage runs on their own key instead of a shared server-side one.
- Real email delivery for the contact form (currently a client-side placeholder).

## Security notes

- Firebase ID tokens and Supabase sessions are verified server-side before any privileged action runs.
- The Supabase service role key and Firebase Admin credentials are used only on the server, never in browser code.
- Found a security issue? Please email the address below instead of opening a public issue.

## Contributing

Issues and pull requests are welcome. Please do not include real credentials, customer data or personal emails in any contribution.

## License

Released under the [MIT License](./LICENSE). The license covers the source code only. Brand names, logos and written content are not covered by the license.

## Contact

Questions, feedback or collaboration: **contact@mespark.in**
GitHub: [@mespark](https://github.com/mespark) · Instagram: [@mespark.py](https://www.instagram.com/mespark.py/)
