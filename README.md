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

Every user brings their own free AI API key (Groq, Gemini or OpenRouter). Zettafry never runs the extraction on a shared key it pays for, so there's no server-side AI cost and no single key for anyone to exhaust.

## Features

- **Multiple input methods**: upload a file, take a photo with the camera, or paste text
- **Bulk processing**: run a batch of bills through the pipeline in one go
- **Editable output table**: fix a misread field before exporting
- **Excel export** (`.xlsx`) with invoice and line-item sheets
- **Bring-your-own-key AI**: each user connects their own Groq, Gemini or OpenRouter key, stored only in their browser, never on the server
- **Auth**: Google sign-in or a one-time email code (Firebase Auth on the client, Supabase for OTP + session) — the same flow signs new users up and signs returning users in
- **Contact form** that emails you directly over Gmail SMTP, with every message also logged to Supabase
- **Usage quota** enforced server-side per signed-in user, with the owner's own account exempt

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React 19, TanStack Start, TanStack Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Animation | Framer Motion |
| Auth | Firebase Auth (Google), Supabase Auth (email OTP) |
| AI | User-provided Groq / Gemini / OpenRouter key, called from a server function |
| Data | Supabase (Postgres) for usage tracking and contact messages |
| Spreadsheet export | `xlsx` |
| Server runtime | Nitro |
| Tooling | Vite, ESLint, Prettier, Bun |

## Project structure

```
src/
├── routes/              # /, /about, /services, /pricing, /contact,
│                         # /auth, /app (console), /privacy, /terms
├── components/site/     # Landing page + console UI (Nav, Footer, ApiKeyPanel, ...)
├── lib/
│   ├── firebase.ts              # Firebase client config (Google sign-in)
│   ├── supabase.ts               # Supabase client (browser)
│   ├── user-keys.ts               # Stores the user's own AI provider key (localStorage)
│   ├── chat.server.ts            # AI extraction pipeline — calls the user's own key
│   ├── chat.functions.ts         # Server functions the console calls
│   ├── usage.server.ts           # Quota tracking (Supabase)
│   ├── mail.server.ts            # Sends the contact form over Gmail SMTP
│   ├── contact.functions.ts      # Server function backing the contact form
│   └── excel.ts                  # Builds the .xlsx export
└── data/content.ts       # Marketing copy, pricing plans

supabase/
├── setup.sql              # Usage-tracking tables — run this first
└── contact_messages.sql   # Contact form log table — run this second
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) and Node.js 20.19+ (or 22+)
- A [Firebase](https://console.firebase.google.com) project with **Google** sign-in enabled
- A [Supabase](https://supabase.com) project with **email OTP** sign-in enabled
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords), for the contact form

### Setup

```bash
git clone https://github.com/mespark/zettafry.git
cd zettafry
bun install
cp .env.example .env
# fill in your Firebase, Supabase and Gmail values, see the table below
bun run dev
```

The app runs at `http://localhost:3000`.

### Database

In the Supabase SQL Editor, run these two files on a fresh project, in this order:

1. `supabase/setup.sql` — usage-tracking tables
2. `supabase/contact_messages.sql` — contact form log table

Neither file contains any personal data or secrets, so it's safe to keep both committed to the repo.

### Environment variables

See [`.env.example`](./.env.example) for the full list. Summary:

| Variable | Used by | Notes |
|---|---|---|
| `VITE_FIREBASE_*` | browser | Firebase web config, for Google sign-in |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | server only | Firebase Admin SDK, used to verify ID tokens. Never commit these |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | Supabase project URL and publishable (anon) key |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | server only | Used for usage tracking and the contact form log. The service role key must never be exposed to the browser |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `CONTACT_INBOX_EMAIL` | server only | Send the contact form over Gmail SMTP |
| `VITE_ADMIN_EMAIL` | browser | The owner's account — exempt from the daily usage quota |

Nothing here configures the AI extraction itself — each visitor adds their own Groq, Gemini or OpenRouter key from the Settings panel inside the app, and it's stored only in their browser.

### Build and deploy

```bash
bun run build      # production build
bun run preview    # preview the build
```

Deploys to Vercel like any TanStack Start app: import the repo, add the environment variables above, and deploy. Variables starting with `VITE_` are embedded in the browser bundle, so Vercel does not allow marking them Sensitive; mark `FIREBASE_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `GMAIL_APP_PASSWORD` as Sensitive.

## How the AI pipeline works

There is no shared, server-paid AI key. `src/lib/user-keys.ts` stores the visitor's own Groq, Gemini or OpenRouter key in `localStorage`. Every extraction request sends that key straight through to `chat.server.ts`, which forwards it to the chosen provider for that one request only — it is never written to a database or logged.

## Security notes

- Firebase ID tokens and Supabase sessions are verified server-side before any privileged action runs.
- The Supabase service role key, Firebase Admin credentials and Gmail App Password are used only on the server, never in browser code.
- User-provided AI API keys live only in the browser's `localStorage` — they are forwarded per-request and never persisted server-side.
- Found a security issue? Please email the address below instead of opening a public issue.

## Contributing

Issues and pull requests are welcome. Please do not include real credentials, customer data or personal emails in any contribution.

## License

Released under the [MIT License](./LICENSE). The license covers the source code only. Brand names, logos and written content are not covered by the license.

## Contact

Questions, feedback or collaboration: **contact@mespark.in**
GitHub: [@mespark](https://github.com/mespark) · Instagram: [@mespark.py](https://www.instagram.com/mespark.py/)
