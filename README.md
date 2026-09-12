# THIRD

A six-chamber visual forge for an AI **third hand** — a 3rd-party anonymous autonomous deputy, not a chatbot. After ignition it talks in the bound voice **and** can reach the operator's hooked-up Grok connectors (Mail, Drive, Calendar).

This repo is a **reference export** for other sessions building something similar. It is not the Grok Build sandbox. Do not rebuild THIRD; steal the contract, the chambers, the hands pattern, and the art.

Live product lives in Grok App Builder. This is the source + stills + paste-ready brief.

---

## Paste this into the other session

```text
Reference repo: https://github.com/AIWander/third
Clone and read README.md first. Look at docs/stills/ then src/lib/clone/ and src/components/forge/.

Product: THIRD — a six-chamber visual forge for an AI “third hand” (clone/deputy), then a live desk that can use the viewer’s hooked-up Grok connectors.

Chambers: ingress → seed (temperament) → voice → mandate (hands) → lattice (traits) → bond (name/trace) → ignition → desk

After ignition the clone talks in the bound voice AND can reach real Mail / Drive / Calendar.

Rules
- Auth/db OFF. Save is localStorage key third.forge.v1
- No Sign in / Re-auth with Grok buttons except the app-data login error CTA: “Continue with Grok to load your data.”
- No trash, no send mail. Drive folder create only if Execute mandate is on
- Viewer connectors via app-data gate only: callTool from createServerFn, NEVER from the client
- Dynamic-import @/lib/app-data/client.server inside the server handler (that file is sandbox-only; pattern is in src/lib/clone/hands.server.ts)
- Documented tools: GoogleDriveTools (search/readFile/listFolder/createFolder), GoogleCalendarTools (listCalendars/search/getEvent/availability)
- Gmail: gmail_search, gmail_get_message (names not in the SDK — treat as best-effort)
- Gate with classifyCallToolError + redirectToLoginIfRequired + useRefetchWhenConnectorReady
- Pending / not_embedded copy: “Open this app from Grok to load your data.”
- Mandates research|watch|draft|protect|mirror|execute unlock read; createFolder is execute-only

Stack
- TanStack Start + React 19 + Tailwind v4 + zustand
- No @react-three/fiber (React 19.3 peer conflict) — raw three.js neural figure in src/components/forge/engine.ts
- xAI chat: grok-4.20-0309-non-reasoning (grok-4.5 burns reasoning tokens). User-initiated, max_tokens ~360, tool loop ≤3 rounds
- OpenAI-style tools / tool_calls / role tool

Do not rebuild THIRD. Use this as the contract for the similar thing you are building.
```

---

## What to look at (in this order)

| Path | Why |
| --- | --- |
| [docs/stills/](docs/stills/) | Chamber + desk screenshots. See the product before the code. |
| [src/lib/clone/types.ts](src/lib/clone/types.ts) | Dossier, stages, mandates, traits, chat messages |
| [src/lib/clone/catalog.ts](src/lib/clone/catalog.ts) | Seed / voice / mandate copy. Chamber 03 unlocks live reach. |
| [src/lib/clone/hands.ts](src/lib/clone/hands.ts) | Connector tool specs, mandate gating, OpenAI tool shapes |
| [src/lib/clone/hands.server.ts](src/lib/clone/hands.server.ts) | `callTool` execution, arg normalize, gate classification |
| [src/lib/clone/speak.ts](src/lib/clone/speak.ts) | xAI chat + tool loop (≤3 rounds) |
| [src/lib/clone/prompt.ts](src/lib/clone/prompt.ts) | System prompt. Stay in voice. Use live reach, never guess inbox/calendar. |
| [src/components/forge/chambers.tsx](src/components/forge/chambers.tsx) | The six chambers |
| [src/components/forge/desk.tsx](src/components/forge/desk.tsx) | Live desk: reach chips, Grok login CTA, calendar/mail/files asks |
| [src/components/forge/engine.ts](src/components/forge/engine.ts) | Raw three.js neural humanoid (no R3F) |
| [src/lib/app-data/](src/lib/app-data/) | Public gate surface: types, login redirect, pending/readiness |
| [public/art/](public/art/) | Seed cards: precision, instinct, architect, ghost, fire |
| [public/og.jpg](public/og.jpg) | 1200×630 share card |
| [public/x-banner.jpg](public/x-banner.jpg) | 50:11 X feed banner |

`src/lib/app-data/client.server.ts` is **not** in this export. It is Grok App Builder platform code. The call site is the dynamic import in `hands.server.ts`.

---

## Stills

| Chamber | Still |
| --- | --- |
| Seed | [docs/stills/chamber-seed.png](docs/stills/chamber-seed.png) |
| Voice | [docs/stills/chamber-voice.png](docs/stills/chamber-voice.png) |
| Lattice | [docs/stills/chamber-lattice.png](docs/stills/chamber-lattice.png) |
| Bond | [docs/stills/chamber-bond.png](docs/stills/chamber-bond.png) |
| Ignition | [docs/stills/chamber-ignition.png](docs/stills/chamber-ignition.png) |
| Desk | [docs/stills/desk.png](docs/stills/desk.png) |
| Desk + briefing | [docs/stills/desk-briefing.png](docs/stills/desk-briefing.png) |
| Desk + calendar gate | [docs/stills/desk-calendar.png](docs/stills/desk-calendar.png) |

---

## Hands (live reach)

Authorized mandates open **read** on Mail, Drive, and Calendar.

| Mandate | Unlocks |
| --- | --- |
| Research, Watch, Draft, Protect, Mirror, Execute | Drive search/read/list, Calendar list/search/event/availability, Gmail search/read |
| Execute only | `google_drive_create_folder` |

Never: trash, send mail, invent an inbox or a schedule. If the gate is pending / not embedded / login-required, say the hand is gated and point them back to Grok.

Login CTA copy (only this, never “Sign in with Grok”):

> Continue with Grok to load your data.

Not-embedded / missing token:

> Open this app from Grok to load your data.

---

## Local save

`localStorage` key: `third.forge.v1`  
Shape: `CloneDossier` in `src/lib/clone/types.ts`.

---

## Brand

- Name: THIRD
- Display: Instrument Serif · Body: IBM Plex Sans
- Palette: near-black `#07080a`, paper `#ecece8`, cool gray accent `#c5cdd6`, danger `#c45c4a`
- `og:type`: `x:game` (`src/lib/og/site.json`)

Seed art is cinematic stills, not icons:

- `public/art/seed-precision.jpg`
- `public/art/seed-instinct.jpg`
- `public/art/seed-architect.jpg`
- `public/art/seed-ghost.jpg`
- `public/art/seed-fire.jpg`

---

## License

Source in this export is provided as reference for AIWander sessions. Art and stills travel with the repo. Not a standalone deployable Grok Build app.
