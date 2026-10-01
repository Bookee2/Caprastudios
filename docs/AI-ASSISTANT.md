# AI consulting and studio assistant

September 28, 2026. Implemented locally; not deployed.

## Current direction

AI consulting is an explicit service alongside design, websites, applications, and motion. This supersedes the earlier plan to omit all AI service positioning. The studio still leads with the work, not with being AI-first. The consulting page covers chat agents, retrieval-augmented knowledge systems, customer service agents, and a broader operating approach across business workflows.

The user wants the website assistant to explain services, answer from studio knowledge, and qualify/capture project inquiries. They selected Anthropic Opus 5.0. Anthropic's documented API ID is **`claude-opus-5`**, used explicitly in `server/agent.mjs`. No silent model substitution.

Primary references checked:
- https://platform.claude.com/docs/en/models/opus-5/overview
- https://platform.claude.com/docs/en/api/overview

## Implemented

- Public homepage feature, dedicated `ai-consulting.html`, navigation, metadata, service schema, and privacy data-flow description.
- Accessible “Ask Capra” dialog across public content pages. Prepared service topics remain available without an API connection; they are explicitly labeled as prepared answers. No fake typing or simulated AI response is presented as live.
- Live chat client and server-side Anthropic Messages API adapter, with recent conversation context and retrieved public knowledge.
- Small curated public corpus in `server/knowledge.mjs`. Deterministic keyword retrieval, not embeddings or a trained custom model. Sources are shown as related pages, not claimed as validated citations for every generated sentence. No second-brain, private business or client files imported.
- Reviewable brief with name, email, business, goal, optional budget/timing, and explicit follow-up consent. Server-side JSONL capture or a visitor-controlled email draft. No automatic outbound messages or CRM integration.
- Plain-text model output, approved source-URL pattern, request limits, schema checks, origin allowlist, per-address/global request caps, provider timeout, and error fallbacks. No model action tools. Server does not log chat transcripts or persist them in its application.

## Configure locally

The ignored `.env` file has been prepared and opened for Kris. Add `ANTHROPIC_API_KEY` there, not in chat, HTML, assets, or a committed file. `LEADS_FILE=./.local/leads.jsonl` enables local brief capture. `.env` and `.local/` are ignored; neither enters the static build.

Restart `PORT=4177 node scripts/serve.mjs` after updating the key. The local server exposes `/api/agent/status`, `/api/agent/chat`, and `/api/agent/lead`. The client changes from the prepared guide to live chat when the server is configured. A key being present is configuration evidence, not proof of account/model access; a real request must still verify it.

Read submitted briefs in the server-side file named by `LEADS_FILE`. They are not automatically emailed. Handle that file as private contact information; do not add it to source control or the public artifact.

## Hosting boundary

GitHub Pages remains the static frontend. It cannot run this Node API. `server/start.mjs` supplies a standalone API process; it is not deployed by the Pages workflow. Set:

- `ANTHROPIC_API_KEY` in the backend host's secret configuration.
- `AGENT_ALLOWED_ORIGINS` to exact allowed website origins, comma-separated.
- `LEADS_FILE` to persistent private storage on the backend host.
- `AGENT_HOST` and `AGENT_PORT` to the host's required bind address and port. Defaults are loopback for local use.
- `SITE_AGENT_ENDPOINT` at frontend build time to the HTTPS API base ending in `/api/agent`.

With no configured frontend endpoint, the public static build intentionally stays in prepared-guide/email-draft mode. No API keys are copied into `dist/`. Before a public launch, choose the backend host, persistent lead delivery/storage and trusted proxy/rate-limit arrangement, and verify live model quality and latency. Current rate limiting is in-memory for a single process; it does not pretend to be distributed abuse prevention. Provider account spend controls should be configured at deployment.

## Verification

`npm run check` includes disposable local server tests. No production database is imported or used. Tests cover request shape, role injection, bounded input, consent, stored lead receipt, denied origins, rate limiting, upstream failure privacy and the exact Anthropic model/request format with an injected mock provider.

Retrieval smoke baseline: 4/4 fixed representative questions retrieved the expected service topic in the top four; an unrelated query retrieved no sources. This is a small deterministic smoke check, not a measured model-quality score. Generated-answer quality, real-provider latency/cost, account access and live grounding remain unmeasured without the actual key.

Browser checks: 1440, 390 and 320 widths, consulting page rendering, dialog open/close/Escape focus return, prepared answers, no-JavaScript static content, and mocked live chat/lead flows. Model HTML is rendered literally and unapproved source URLs are rejected. Backend capture is tested separately against a disposable directory; browser QA does not insert dummy leads into the real local inbox.

Final state: all eight automated checks pass, public builds pass, final desktop/tablet/phone navigation and dialog renders were inspected, and no key or backend files are present in the static artifact. As of this pass, `/api/agent/status` reports `live: false, leads: true`: the local capture endpoint is available, but no Anthropic key is configured in the running server. The live provider has not been called.
