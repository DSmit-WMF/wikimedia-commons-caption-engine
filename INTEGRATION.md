# Integration and future work

This document describes how well the app is abstracted for reuse (e.g. in UploadWizard or other Commons flows) and how to switch from owner-only OAuth to per-user OAuth for multi-user use.

---

## 1. Abstraction and reuse

### What is already modular

- **Caption engine** (`backend/src/caption_engine/`): `translateCaptions()` and `validateCaption()` are pure logic. They take inputs (OpenAI client, text, languages, optional context) and return results. They do **not** depend on Express or Commons. Translation uses the OpenAI **Responses API** with `reasoning: { effort: "low" }` so reasoning models (e.g. gpt-5-mini) return visible output; caption-from-image uses Chat Completions. Another Node.js app can `import` and use them directly.

- **Commons adapter** (`backend/src/commons_adapter/`): `getFileInfo(identifier)`, `resolveFileToMediaInfoId(identifier)`, and `saveLabels(mediaInfoId, captions, oauthToken)` are the main entry points. They depend only on axios, config (User-Agent), and the Commons API. The **token is passed as an argument** to `saveLabels`, so the adapter does not assume a single global token. This is the layer you would reuse or reimplement when plugging into MediaWiki/Commons (e.g. PHP calling the same Commons APIs).

- **HTTP API layer** (`backend/src/routes/`, `controllers/`, `services/`): Express routes → controllers → services → caption_engine / commons_adapter. The API is a thin wrapper; `POST /api/commons/save-captions` accepts a token from the request (header or body) and falls back to `COMMONS_OAUTH_TOKEN` (see §2). For integration, you can keep using this app as a microservice, or call the **caption_engine** and **commons_adapter** directly and skip the HTTP layer.

### Plugging into MediaWiki/Commons

The backend is designed so you can later integrate with MediaWiki/Commons in three ways (unchanged by the modular refactor):

**Option A — Use this backend as a microservice**

- UploadWizard (or another frontend) keeps its own UI and calls this app’s HTTP API:
  - `GET /api/commons/file-info?url=...` — get file metadata and existing labels
  - `POST /api/translate-captions` — get translation suggestions
  - `POST /api/validate-caption` — validate caption text
  - `POST /api/commons/save-captions` — write labels (with the user’s token once per-user OAuth is in place)
- Per-user token support is already implemented: the consuming app can send the user’s token with each save request (see §2). You need a stable base URL and possibly CORS / auth middleware for the consuming app.

**Option B — Reuse the Node modules in another Node app**

- Import or copy the `caption_engine` and `commons_adapter` modules (and their dependencies: `openai`, `axios`, `zod`). Your app provides the OpenAI key and, for saving, the OAuth token per request. You can use the existing `services/` layer or call the caption_engine and commons_adapter directly and skip Express entirely (e.g. for a MediaWiki Node-based gadget or server-side script).

**Option C — Reimplement in another stack (e.g. PHP for UploadWizard)**

- The behaviour is specified by **`openapi.yaml`** and the backend implementation. Translation = call OpenAI (or another provider) with the same prompt shape. Validation = same rules (length, no speculation, etc.). Commons = same MediaWiki API calls (`action=query` for file info, `wbgetentities` for labels, `wbsetlabel` for saving).

### API contract (OpenAPI)

The HTTP API is documented in **`openapi.yaml`** (OpenAPI 3.0) at the repo root. It covers all endpoints, request/response schemas, and auth (optional Bearer / `oauth_token` for save-captions). Use it for codegen, documentation, or embedding.

### Remaining gaps for drop-in integration

- Frontend assumes this backend URL and paths; another consumer can use the same paths and the OpenAPI spec to integrate.
- Language list and “suggested languages” are served by this app; an integrator might want to host their own or reuse `GET /api/languages` and `GET /api/languages/all`.

---

## 2. Per-user OAuth (multi-user mode)

The app is **per-user OAuth ready**: the backend accepts a user token and the frontend is wired to pass it through. Only the OAuth flow (login UI / redirect) remains to be implemented.

### What’s already in place

**Backend**

- `POST /api/commons/save-captions` accepts the OAuth token in either:
  - `Authorization: Bearer <token>` header, or
  - JSON body field `oauth_token`.
- If a token is provided, it is used for the Commons API calls; otherwise the server falls back to `COMMONS_OAUTH_TOKEN` from env (owner-only mode). If neither is set, the route returns 503 with a clear error.

**Frontend**

- **`AuthContext`** (`frontend/contexts/AuthContext.tsx`): holds `accessToken` (initially `null`) and `setAccessToken`. The app is wrapped in `AuthProvider` in the root layout.
- **`saveCaptionsToCommons`** (`frontend/lib/api.ts`): takes an optional third argument `{ accessToken?: string | null }`. When provided, the token is sent in both the `Authorization` header and the `oauth_token` body field.
- **`CaptionEditor`**: uses `useAuth()` and passes `accessToken` into every `saveCaptionsToCommons` call. With `accessToken === null` (default), no token is sent and the backend uses owner-only env token.

### What remains for full per-user mode

1. **Implement the OAuth flow**  
   Add the MediaWiki OAuth 2.0 authorization flow (redirect to Meta-Wiki, user grants “Edit existing pages”, callback with auth code, exchange for access token). On success, call `setAccessToken(accessToken)` so the rest of the app uses the user’s token automatically.

2. **Optional UI**  
   A “Log in with Wikimedia” button that starts the flow, and a “Log out” that calls `setAccessToken(null)`. You can show a short message when `isPerUserMode` is true (e.g. “Saving as your account”).

3. **Config and docs**  
   Keep `COMMONS_OAUTH_TOKEN` optional for owner-only / dev. Document that for multi-user deployment the frontend runs the OAuth flow and sets the token; no backend config change is required.

### Security notes

- Do not log or persist user OAuth tokens. Prefer sending them in the `Authorization` header and clearing them when the user logs out or the session ends.
- Use HTTPS in production so the token is not sent in the clear.
- Restrict CORS so only your frontend (or UploadWizard’s origin) can call the save endpoint, if the API is public.

---

## 3. OAuth documentation

**[docs/OAUTH.md](docs/OAUTH.md)** covers:

- **Owner-only OAuth**: getting the token, setting `COMMONS_OAUTH_TOKEN`, and security.
- **Per-user OAuth**: registering a consumer (redirect URIs, grants), implementing the authorization flow, scopes, token handling, and refresh.
- A short summary table of both modes.

See that file for step-by-step instructions and security notes.
