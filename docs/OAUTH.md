# OAuth for Wikimedia Commons Caption Translation Tool

This document describes how to use OAuth with the caption tool: **owner-only** (single-account, dev/demo) and **per-user** (multi-user, each person saves as themselves).

---

## 1. Owner-only OAuth (current setup)

One token is stored on the server. All “Save to Commons” requests use that token. Suitable for:

- Local development
- Demos and hackathons
- A single shared bot or tool account

### Getting the token

1. Log in to [Meta-Wiki](https://meta.wikimedia.org) with your Wikimedia account.
2. Open [OAuth 2.0 consumer registration](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose/oauth2).
3. Fill in **Application name** and **Description**. Set **Grant type** to **Owner-only** (this consumer is only for you).
4. Under **Applicable grants**, request only **Edit existing pages**. Do not request upload, delete, block, or other grants.
5. Submit. On the result page, copy the **access token** (shown once only).
6. Put it in `.env`:
   ```env
   COMMONS_OAUTH_TOKEN=your-access-token-here
   ```
7. Restart the backend. The app will use this token for every save when the frontend does not send a user token.

### Security

- Keep `.env` out of version control (it is in `.gitignore`).
- Do not share the token. If it is exposed, create a new consumer and revoke the old one on Meta-Wiki.
- Owner-only tokens are long-lived; you usually do not need to refresh them.

---

## 2. Per-user OAuth (multi-user)

Each user logs in with their own Wikimedia account. Saves are made as that user. The app is already wired for this; you only need to implement the login flow and pass the token.

### How it works

- The backend accepts a token per request: either `Authorization: Bearer <token>` or JSON body field `oauth_token`.
- If a token is sent, the backend uses it for Commons API calls. If not, it falls back to `COMMONS_OAUTH_TOKEN` (owner-only).
- The frontend has `AuthContext` and passes `accessToken` into `saveCaptionsToCommons`. When you implement login, call `setAccessToken(accessToken)` after a successful OAuth callback.

### Registering a consumer for per-user use

1. Log in to [Meta-Wiki](https://meta.wikimedia.org).
2. Open [OAuth 2.0 consumer registration](https://meta.wikimedia.org/wiki/Special:OAuthConsumerRegistration/propose/oauth2).
3. **Application name** and **Description**: e.g. “Commons Caption Tool” and a short description.
4. **Grant type**: choose **Authorization code** (or the option that allows multiple users to authorize).
5. **Redirect URI(s)**:
   - For local dev: `http://localhost:3003/oauth/callback` (or the path where your app handles the callback).
   - For production: `https://your-domain.example/oauth/callback`.
   - Add every URI where users will be sent after authorizing. Meta-Wiki will only redirect to these exact URLs.
6. **Applicable grants**: request only **Edit existing pages**.
7. Submit. You will get a **consumer key** (client ID) and **consumer secret** (client secret). Store the secret securely (e.g. env vars, not in the frontend).

### Implementing the OAuth flow

1. **Redirect to authorize**  
   Send the user to the Meta-Wiki authorization URL with your consumer key, redirect_uri, scope, state (CSRF), and `response_type=code`.  
   Example base URL:  
   `https://meta.wikimedia.org/wiki/Special:OAuth2/authorize`  
   Parameters: `client_id`, `redirect_uri`, `response_type=code`, `scope`, `state`.  
   See [MediaWiki OAuth 2.0 documentation](https://www.mediawiki.org/wiki/OAuth/For_Developers#OAuth_2.0) for the exact query shape.

2. **Handle the callback**  
   Your redirect URI receives a `code` (and `state`). Verify `state`, then exchange `code` for an access token (server-side, using the consumer secret). Do not do the token exchange in the frontend; the secret must stay on the server.

3. **Store and use the token**  
   Once you have the access token, call `setAccessToken(accessToken)` (from `AuthContext`). The existing UI will then send this token on every “Save to Commons” request. Clear it on logout with `setAccessToken(null)`.

### Scopes

- **Edit existing pages** is enough to call `wbsetlabel` and update captions on existing Commons files.
- Do not request “Upload new files”, “Delete pages”, or other grants unless you need them.

### Token lifetime and refresh

- Access tokens from the authorization-code flow may have an expiry. If the provider issues a refresh token, store it securely and use it to obtain a new access token when needed; then call `setAccessToken(newToken)`.
- If refresh is not implemented, the user must log in again when the token expires.

### Security (per-user)

- Do not log or persist access tokens in plain text. Prefer memory or short-lived session storage.
- Do the code-for-token exchange on the backend; never put the consumer secret in the frontend.
- Use HTTPS in production so tokens are not sent in the clear.
- Validate the `state` parameter on the callback to prevent CSRF.
- Restrict CORS on your API so only your frontend (or known origins) can call the save endpoint.

---

## 3. Summary

| Mode       | Token from                       | Use case                            |
| ---------- | -------------------------------- | ----------------------------------- |
| Owner-only | `COMMONS_OAUTH_TOKEN` in .env    | Dev, demo, single account           |
| Per-user   | Frontend sends token per request | Multi-user, each user saves as self |

For implementation details (backend and frontend wiring), see [INTEGRATION.md](../INTEGRATION.md#2-per-user-oauth-multi-user-mode).
