# Commons Caption Suggestion Tool

AI-assisted multilingual caption suggestions for Wikimedia Commons. Human-in-the-loop: you review and edit captions before saving.

---

## Quickstart

### 1. Prerequisites

- **Node.js** 18+ (for local run) and **npm**
- **Docker** and **Docker Compose** (optional; for containerized run)
- **OpenAI API key** ([create one](https://platform.openai.com/api-keys))

### 2. Clone and configure

```bash
cd caption-engine
cp .env.example .env
```

Edit `.env` and set:

```env
OPENAI_API_KEY=sk-your-key-here
```

Optional (for saving captions to Commons):

```env
COMMONS_OAUTH_TOKEN=your-owner-only-oauth2-token
```

**How to get a Commons API token (owner-only OAuth 2.0):**

1. Log in to [Meta-Wiki](https://meta.wikimedia.org) with your Wikimedia account.
2. Open the [OAuth 2.0 consumer registration](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose/oauth2) page.
3. Fill in a name and description for your app, set the grant type to **owner-only**, then submit.
4. Under **Applicable grants**, request only **Edit existing pages**. (That is enough to set captions on existing Commons files. Do not request upload, delete, block, or other grants.)
5. On the result page, copy the **access token** and paste it into `.env` as `COMMONS_OAUTH_TOKEN`.  
   (Store it securely; the token is shown only once. If you lose it, create a new consumer.)

Without this token you can still generate and edit captions; only the “Save to Commons” step will be disabled.

### 3. Run the app

**Option A — Docker (recommended)**

```bash
# Development (live reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or: production-style build
docker compose up --build
```

**Option B — Local**

```bash
# Terminal 1: backend
cd backend && npm install && npm run dev

# Terminal 2: frontend
cd frontend && npm install && npm run dev
```

### 4. Open the app

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001](http://localhost:3001) (e.g. [http://localhost:3001/api/health](http://localhost:3001/api/health))

### 5. Use it

1. Upload an image or paste a Wikimedia Commons file URL.
2. Choose languages (use “Add or remove languages”).
3. Click **Generate captions**, then review and edit.
4. Copy/export or (if configured) save to Commons.

---

## Stack

- **Backend:** Node.js, Express, TypeScript, OpenAI (vision + text), Zod
- **Frontend:** Next.js (App Router), [shadcn/ui](https://ui.shadcn.com/) (Radix UI + cmdk Command)
- **Run:** Docker Compose (optional: dev override for live reload)

## API

- `GET /api/health` — liveness
- `POST /api/caption-preview` — image (multipart or `image_url` JSON) → caption + warnings
- `POST /api/translate-captions` — captions + target_langs → translated captions
- `POST /api/validate-caption` — text → valid + warnings
- `GET /api/languages?preferred_lang=` — suggested language list
- `POST /api/commons/save-captions` — file_identifier + captions (Bearer token)
- `GET /api/commons/file-info?url=` or `?title=` — file info + existing labels

## Frontend (shadcn/ui)

The UI uses [shadcn/ui](https://ui.shadcn.com/) with **Radix UI** primitives and the **Command** component (cmdk) for the language selector. No custom command palette — the language picker is implemented with shadcn’s Command inside a Dialog.

## License

MIT
