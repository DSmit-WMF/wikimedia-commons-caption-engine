# Product and architecture

See the main design and implementation plan in `.cursor/plans/` (Commons Caption Suggestion Tool). This doc summarizes product and architecture.

## Product

- **What:** Human-in-the-loop metadata assistant for Wikimedia Commons. Suggests short, factual, multilingual captions; user reviews and edits; optional save to Commons.
- **Not:** Automatic uploader or batch tool. The user always approves before any write.

## Caption rules (Commons)

- Short, factual, neutral.
- Only what is visible; no speculation, no opinions, no copyright text in the caption.

## Architecture

1. **Caption engine** — OpenAI vision + text: generate caption, translate, validate. No Commons dependency.
2. **Commons adapter** — Resolve file → MediaInfo ID; write labels via Commons API; OAuth owner-only for MVP.
3. **User interface** — Next.js + shadcn/ui (Radix UI + Command). Calls backend API; user edits captions and can save to Commons.

## Frontend stack

- **Next.js** (App Router), **shadcn/ui** ([ui.shadcn.com](https://ui.shadcn.com/)), **Radix UI**, **Command** (cmdk). Language selection uses the shadcn Command component (not a custom implementation).
