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

- **Frontend:** [http://localhost:3003](http://localhost:3003)
- **Backend API:** [http://localhost:3002](http://localhost:3002) (e.g. [http://localhost:3002/api/health](http://localhost:3002/api/health))

### 5. Use it

1. Paste a **Commons file URL** (e.g. `https://commons.wikimedia.org/wiki/File:Example.jpg`) and click **Load**, or use **Random image** to load a random Commons file that has captions.
2. If the file has no captions, you’ll see “No captions on this file. Add captions on Commons first.” Otherwise, existing captions are shown and a thumbnail is displayed.
3. Choose languages (default: en, es, fr, ar, zh) with “Add or remove languages”. Star a language in the picker to add it to **Favourites** (stored in the browser); favourites always appear at the top.
4. Rows marked **(from Commons)** were loaded from the file; you can **edit** them or use **Generate** to overwrite with a new translation. For any language without a caption, use **Generate** (that row) or **Generate all** to translate from an existing caption.
5. Edit captions as needed. **Send** (per row) or **Send all** (footer) validates and saves to Commons. Validation errors appear under the field; after a successful send the row is marked “Sent” and **Send** is disabled until you edit or regenerate.

---

## Stack

- **Backend:** Node.js, Express, TypeScript, OpenAI (text for translation), Zod
- **Frontend:** Next.js (App Router), [shadcn/ui](https://ui.shadcn.com/) (Radix UI + cmdk Command)
- **Run:** Docker Compose (optional: dev override for live reload)

## API

- `GET /api/health` — liveness
- `GET /api/commons/file-info?url=` or `?title=` — load file info, existing labels, descriptions, and thumbnail URL
- `GET /api/commons/random-file` — random Commons file that has structured-data labels (for “Random image”)
- `POST /api/translate-captions` — source captions + target_langs (+ optional `description_context`) → translated captions
- `POST /api/validate-caption` — text → valid + warnings
- `GET /api/languages?preferred_lang=` — suggested language list
- `GET /api/languages/all` — all MediaWiki languages with native and English names (languageinfo API)
- `POST /api/commons/save-captions` — file_identifier + captions (server uses `COMMONS_OAUTH_TOKEN` from env)

## Frontend (shadcn/ui)

The UI uses [shadcn/ui](https://ui.shadcn.com/) with **Radix UI** primitives and the **Command** component (cmdk) for the language selector. Language labels and placeholders use native and English names from the API (e.g. “中文 (Chinese - zh)”). **Generate** is available for every language row (including those loaded from Commons). Validation runs when you click **Send** or **Send all**; errors are shown per field. Favourite languages are stored in `localStorage`.

## License

MIT
