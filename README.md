# REPForge

AI-powered fitness ecosystem — Next.js (JavaScript, App Router), CSS Modules, MongoDB/Mongoose.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in real values
npm run dev
```

Open http://localhost:3000.

## Environment variables

See `.env.local.example`:

- `MONGODB_URI` — MongoDB Atlas connection string (Database → Connect → Drivers in the Atlas dashboard). A free-tier cluster is enough for development.
- `JWT_SECRET` — any long random string, used to sign the login token. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Deploying to Netlify

1. Push this project to a GitHub repo.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build command: `next build` (Netlify's Next.js runtime handles the rest — install the official "Next.js" plugin if it isn't auto-detected).
4. Add `MONGODB_URI` and `JWT_SECRET` as Netlify environment variables (Site settings → Environment variables) — use production-strength values, not the dev ones.
5. Deploy.

## What's in this build

See `PROGRESS.md` for the phase-by-phase status against the master spec.
