---
name: run-wargame-web
description: Build, run, and drive wargame-web (the MechWarrior static Next.js SPA). Use when asked to start wargame-web, run its dev server, build the static export, take a screenshot of its UI, or interact with a page (unit builder, cards, my collection, drafts, game mode).
---

wargame-web is a client-only Next.js 15 App Router SPA (no SSR, no API
routes — see [CLAUDE.md](../../../CLAUDE.md)). "Running" it means
starting the Next dev server and driving a headless Chromium against
it. `chromium-cli` is not installed on this host, so drive it with
`.claude/skills/run-wargame-web/driver.mjs`, a small Playwright-based
REPL with the same nav/click/fill/screenshot vocabulary.

All paths below are relative to the repo root
(`/Users/usuario/Documents/projects/mechwarrior/wargame-web`).

## Prerequisites

Node + npm (already used by this project). Playwright is a devDependency
(`package.json`); its browser binary must be downloaded once per machine:

```bash
npx playwright install chromium
```

## Setup

```bash
npm install
```

`.env.local` must set `NEXT_PUBLIC_API_BASE_URL` (already present in
this checkout, pointing at the shared dev API — see CLAUDE.md's env
var table). No other setup is required; there's no build step needed
to run the dev server.

## Run (agent path)

Start the dev server in the background and wait for it to actually serve:

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill 2>/dev/null   # free the port if a stale server is running
nohup npx next dev -p 3000 > /tmp/wargame-dev.log 2>&1 &
disown
i=0; until curl -sf http://localhost:3000/ >/dev/null 2>&1 || [ $i -ge 40 ]; do sleep 1; i=$((i+1)); done
```

Drive it by piping commands to the driver's stdin:

```bash
node .claude/skills/run-wargame-web/driver.mjs <<'EOF'
nav /unit-builder
wait-for text=Nova Unidade
fill input:nth-of-type(1) Timber Wolf
screenshot unit-builder-filled
console
quit
EOF
```

Screenshots land in `.claude/skills/run-wargame-web/shots/<name>.png`
(latest is also copied to `shots/screenshot.png`).

Stop the server the same way you started it:

```bash
lsof -ti:3000 -sTCP:LISTEN | xargs -r kill 2>/dev/null
```

### Driver commands

| command | what it does |
|---|---|
| `nav <path-or-url>` | goto a URL; a relative path resolves against `http://localhost:3000` |
| `wait-for <selector>` | wait for a CSS selector, or `text=...` for visible text |
| `click <selector>` | click the first match |
| `fill <selector> <text>` | fill an input via Playwright's `fill()` (selector must not contain spaces — see Gotchas) |
| `press <key>` | keyboard press, e.g. `Enter` |
| `eval <js>` | `page.evaluate(js)`, prints the JSON result |
| `screenshot [name]` | save `shots/<name-or-counter>.png` |
| `console` | print and clear buffered `console`/`pageerror` messages since the last call |
| `quit` | close the browser and exit |

Commands run strictly in order (each line waits for the previous one
to finish) so a `fill` is never raced by the next `screenshot`.

## Run (human path)

```bash
npm run dev        # wraps `next dev`, strips a stray --localstorage-file flag some shells inject
# or: npm run dev:next -- -p 3000
```

Open `http://localhost:3000`. Ctrl-C to stop.

## Build (static export)

```bash
npm run build       # sets NEXT_PUBLIC_EXPORT=true, outputs to out/
```

Verified this produces `out/` with the app's routes as static HTML
(per CLAUDE.md, this is the only supported deploy artifact — no `[id]`
dynamic routes, IDs are passed as `?id=` query params).

## Test / Lint

```bash
npm run lint
```

There is no automated test suite in this repo (no `test` script, no
`*.test.*` files) — `lint` is the only automated check.

---

## Gotchas

- **Next.js Fast Refresh resets in-flight form state.** During dev,
  HMR rebuilds ("`[Fast Refresh] rebuilding`" in the console log) can
  remount a client component and wipe local `useState` — including a
  value you just `fill`ed into a form a moment earlier if a long
  `wait-for` sits in between. Keep `fill` immediately followed by the
  `screenshot`/assertion that reads it back; don't leave an unrelated
  long wait between them.
- **CSS selectors with spaces break the driver's line parser.** The
  driver splits each input line on the first space to separate a
  command from its argument (and, for `fill`, the selector from the
  text), so `input[placeholder="Ex: Raven"]` truncates at the space
  inside the quotes. Use a space-free selector instead — e.g.
  `input:nth-of-type(1)` — or add a `data-testid` in the component if
  you need to target something precisely and repeatedly.
- **`text=` locators only match rendered text nodes, not input
  values.** `wait-for text=Timber Wolf` will time out even after a
  successful `fill` that put "Timber Wolf" in an `<input>` — check the
  value with `eval document.querySelector('sel').value` instead, or
  just screenshot.
- **`.env.local`'s `NEXT_PUBLIC_API_BASE_URL` points at a real shared
  dev server** (`104.131.26.32:4000`), not a local mock — pages that
  fetch data (My Collection, Search, Cards) depend on that host being
  reachable.
