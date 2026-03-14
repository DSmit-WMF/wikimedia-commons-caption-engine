# Wikimedia Commons Caption Translation Tool

AI-assisted multilingual caption translation for Wikimedia Commons. Human-in-the-loop: you review and edit captions before saving.

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

Optional:

- **`OPENAI_MODEL`** — Model for translation and caption generation (default: `gpt-5-nano`). Guide:
  - **gpt-5-nano** — High-throughput, straightforward instruction-following (default; good for translation).
  - **gpt-5-mini** — Cost-optimized reasoning and chat; balances speed, cost, and capability.
  - **gpt-5.4** — General-purpose work, complex reasoning, broad knowledge.
  - **gpt-5.4-pro** — Tough problems needing deeper reasoning.

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

# If the backend fails with "Cannot find package", refresh the backend node_modules volume:
#   docker compose -f docker-compose.yml -f docker-compose.dev.yml run backend npm install
# then run `up` again.

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

**OpenAPI spec (dev only):** When not in production, the backend serves the spec and Swagger UI at [http://localhost:3002/api-docs](http://localhost:3002/api-docs) and [http://localhost:3002/openapi.yaml](http://localhost:3002/openapi.yaml). These routes are not mounted in production.

### 5. Use it

1. Paste a **Commons file URL** (e.g. `https://commons.wikimedia.org/wiki/File:Example.jpg`) and click **Load**, or use **Random image** to load a random Commons file that has captions.
2. If the file has no captions, you’ll see “No captions on this file. Add captions on Commons first.” Otherwise, existing captions are shown and a thumbnail is displayed.
3. Choose languages (default: en, es, fr, ar, zh) with “Add or remove languages”. Star a language in the picker to add it to **Favourites** (stored in the browser); favourites always appear at the top.
4. Rows marked **(from Commons)** were loaded from the file; you can **edit** them or use **Generate** to overwrite with a new translation. For any language without a caption, use **Generate** (that row) or **Generate all** to translate from an existing caption.
5. Edit captions as needed. **Send** (per row) or **Send all** (footer) validates and saves to Commons. Validation errors appear under the field; after a successful send the row is marked “Sent” and **Send** is disabled until you edit or regenerate.
6. **Revert** (per row) restores that caption to the last loaded or last sent value. **Skip to captions** in the header (or **Alt+C**) jumps to the Captions section.

---

## Stack

- **Backend:** Node.js, Express, TypeScript, OpenAI (text for translation), Zod
- **Frontend:** Next.js (App Router), [shadcn/ui](https://ui.shadcn.com/) (Radix UI + cmdk Command)
- **Run:** Docker Compose (optional: dev override for live reload)

## API

Full request/response contract: **[openapi.yaml](openapi.yaml)** (OpenAPI 3.0).

- `GET /api/health` — liveness
- `GET /api/commons/file-info?url=` or `?title=` — load file info, existing labels, descriptions, and thumbnail URL
- `GET /api/commons/random-file` — random Commons file that has structured-data labels (for “Random image”)
- `POST /api/translate-captions` — source captions + target_langs (+ optional `description_context`) → translated captions
- `POST /api/validate-caption` — text → valid + warnings
- `GET /api/languages?preferred_lang=` — suggested language list
- `GET /api/languages/all` — all MediaWiki languages with native and English names (languageinfo API)
- `POST /api/commons/save-captions` — file_identifier + captions (optional `Authorization: Bearer` or `oauth_token`; else server uses `COMMONS_OAUTH_TOKEN`)

## Frontend (shadcn/ui)

The UI uses [shadcn/ui](https://ui.shadcn.com/) with **Radix UI** primitives and the **Command** component (cmdk) for the language selector. Language labels and placeholders use native and English names from the API (e.g. “中文 (Chinese - zh)”). **Generate** is available for every language row (including those loaded from Commons). Validation runs when you click **Send** or **Send all**; errors are shown per field. Favourite languages are stored in `localStorage`. **Revert** restores a row to its baseline (loaded or last sent). Power users: use **Skip to captions** or **Alt+C** to jump to the Captions section.

## Integration and multi-user OAuth

- **Reuse and per-user OAuth:** [INTEGRATION.md](INTEGRATION.md)
- **OAuth setup (owner-only and per-user):** [docs/OAUTH.md](docs/OAUTH.md)

## Future work

- **i18n the app** — Internationalize the UI (labels, buttons, messages) so the tool can be used in the contributor’s preferred language (e.g. next-intl, react-i18next, or Next.js built-in i18n).

## License

MIT
