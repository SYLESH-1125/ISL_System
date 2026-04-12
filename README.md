# Text to Indian Sign Language (ISL) — System Documentation

This document describes **what this repository is**, **how the pieces fit together**, **what users can do**, and **how to reuse it as context for LLMs** (for example ChatGPT) when you want prompts to optimize, refactor, or extend the project.

---

## 1. Executive summary

This is a **single-page Next.js web application** that converts **typed or spoken text** into a sequence of **Indian Sign Language (ISL) animations** shown on a **3D signing avatar**. It runs entirely in the **browser**: there is **no custom backend API** in this repo for translation or signing.

The app combines:

- **React / Next.js** for UI, routing, and static hosting of assets.
- **CWASA** (City University Web Authoring Sign Language Avatar), loaded from a large bundled script (`public/js/allcsa.js`), for avatar rendering and **SiGML** playback.
- A **hard-coded English gloss list** (`SIGML_WORDS` in code) plus a **generated lexical dataset** (`isl-dataset.ts`, ~1,708 entries) mapping English words to **sign names** that correspond to files under `public/SignFiles/*.sigml`.
- **Heuristic Subject–Object–Verb (SOV)** reordering for display, aligned with common ISL sentence patterns (simplified English grammar).

**Primary user journey:** Open the app → enter text (or use voice) → choose English / Hindi / Tamil for speech recognition → submit → see glosses in SOV order → watch the avatar play each sign sequentially from SiGML files.

---

## 2. Technology stack (pinned as in `package.json`)

| Layer | Technology |
|--------|-------------|
| Framework | **Next.js 16.0.3** (App Router), **Turbopack** in dev |
| UI | **React 19.2.0**, **TypeScript 5** |
| Styling | **Tailwind CSS 4.x** (`@import 'tailwindcss'`, `@theme` in `app/globals.css`) |
| Components | **shadcn-style** Radix UI primitives (`components/ui/*`) |
| Icons | **lucide-react** |
| Forms / validation (available in stack, light use here) | **react-hook-form**, **zod**, **@hookform/resolvers** |
| Analytics | **@vercel/analytics** (in `app/layout.tsx`) |
| Avatar / signing | **CWASA** + **SiGML** (static files + `public/jas/loc2021/...`) |

**Scripts:** `pnpm dev` / `npm run dev` → `next dev -p 3000`; `pnpm build` → `next build`; `pnpm start` → `next start -p 3000`.

---

## 3. Repository layout (high-signal paths)

```
app/
  layout.tsx       # Root layout, metadata, fonts, Vercel Analytics
  page.tsx         # Home: renders only <ISLAvatarPlayer />
  globals.css      # Tailwind v4 theme tokens

components/
  isl-avatar-player.tsx   # MAIN FEATURE — CWASA host, translator UI, tabs
  dataset-viewer.tsx      # Searchable table over ISL_DATASET, triggers playSign
  isl-animation-player.tsx  # Alternate/demo player (static image + fake timing) — NOT mounted on home page
  ui/                     # Shared primitives (Button, Card, Select, …)

public/
  js/allcsa.js            # CWASA bundle (~5.5MB+), loaded via next/script
  css/cwasa.css           # Linked from isl-avatar-player for CWASA UI hooks
  SignFiles/*.sigml       # Hundreds of SiGML assets (glob shows ~848 .sigml files)
  jas/loc2021/            # Full JAS/CWA install: avatars, configs, legacy HTML/JNLP, cwa/*.js

isl-dataset.ts          # Auto-generated TS export: ISL_DATASET array
isl-dataset.json        # JSON mirror (if used by tooling; main app imports .ts)

next.config.mjs         # turbopack.root, ignoreBuildErrors, unoptimized images
scripts/fix-pgbouncer-port.ps1  # Windows helper (optional): PgBouncer port 3000→6432
```

---

## 4. How the system works (end-to-end)

### 4.1 Boot sequence

1. User opens `/` → `app/page.tsx` mounts `ISLAvatarPlayer` inside a gradient `<main>`.
2. `ISLAvatarPlayer` injects:
   - `<Script src="/js/allcsa.js" strategy="afterInteractive" />` — loads **CWASA** on `window.CWASA`.
   - `<link href="/css/cwasa.css" />` — styles for CWASA-generated controls.
3. A `div` with classes **`CWASAAvatar av0`** must exist in the DOM; CWASA binds into it.
4. A polling loop waits until `window.CWASA` exists **and** the `.CWASAAvatar.av0` node is present, then calls **`CWASA.init(initCfg)`** with avatar list `["luna","siggi","anna","marc","francoise"]` and initial avatar **`marc`**.
5. The code polls for **canvas or iframe** (or substantial innerHTML) inside the avatar container to flip **`avatarLoaded`** / **`isLoading`** and status **Ready**.

### 4.2 Text → glosses → SiGML URLs

1. **Input:** User text is split on whitespace (no advanced tokenizer).
2. **Optional spoken language:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) with `lang` set to `en-US`, `hi-IN`, or `ta-IN`. Transcript fills the text field.
3. **Tamil/Hindi gloss hints:** A small `WORD_TRANSLATIONS` map maps a few native script tokens to English keys used downstream.
4. **SOV display:** `convertToSOV` expands contractions, strips/strips auxiliaries, finds a verb from a fixed verb list (plus `-ing`/`-ed` heuristics), and builds **Subject + Objects + Verb (+ question word)** order for **display chips**.
5. **Playback glosses:** For each display token:
   - If it is in **`SIGML_WORDS`** (large in-file array), that string is used as the **sign filename stem** (see below).
   - Else **`getFallbackSign`** tries **`WORD_TO_SIGN_MAP`** from `ISL_DATASET` (word → `sign`), then morphological variants (`ing`/`ed`/`s`…), then “substring contains a known `SIGML_WORDS` entry”.
   - If nothing matches, the word may be **skipped** for animation (logged in console).
6. **SiGML path rule:** `playSiGMLAnimation` sets URL to **`/SignFiles/${filename}.sigml`** where `filename` is **uppercase** for single-character glosses (fingerspelling letters) and **lowercase** otherwise. It also sets hidden CWASA URL input `#URLText` (class `txtSiGMLURL av0`).
7. **Playback engine:** `cwaRef.current.playSiGMLURL(sigmlURL)` is awaited; a **1s interval** scheduler walks the gloss list, using **`playerAvailableToPlay`** and DOM `.statusExtra` to guess when the player is ready for the next clip.

### 4.3 Dataset tab

- Second tab **“Real ISL Dataset (1,722 Actions)”** toggles `activeTab === 'dataset'`.
- **`DatasetViewer`** reads **`ISL_DATASET`**, filters by search string and category, renders a scrollable table.
- Clicking a row’s “Watch Sign” tile calls **`window.playSign('/SignFiles/<sign>.sigml')`**, which **`ISLAvatarPlayer`** defines after CWASA init — reusing the same avatar instance.
- On the dataset tab, the avatar card is **fixed bottom-right** (mini preview) while the table stays primary.

### 4.4 Unused / secondary component

- **`ISLAnimationPlayer`** (`components/isl-animation-player.tsx`): self-contained **demo** with a static remote PNG and **simulated** frame/sign counters. It is **not imported** by `app/page.tsx`. Safe to remove or wire up as an alternate route if desired.

---

## 5. Data assets

### 5.1 `ISL_DATASET` (`isl-dataset.ts`)

- Header comment: **1,708 entries** (UI copy sometimes says “1,722”; treat file header as source of truth unless regenerated).
- Shape: `{ word, sign, sovExample, category }`.
- **Purpose:** Map many English lemmas to a **smaller set** of **sign names** that have `.sigml` files; `sovExample` is illustrative text (some auto-generated examples have awkward English).
- **Categories:** e.g. Transportation, General, Medical, Legal, Communication — used only for filtering in `DatasetViewer`.

### 5.2 `SIGML_WORDS`

- Large **string array** embedded in `isl-avatar-player.tsx` — words/glosses expected to map **1:1** to `public/SignFiles/<word>.sigml` (case rule above).
- This duplicates knowledge also implied by filesystem; **drift risk** if one side updates without the other.

### 5.3 `public/SignFiles`

- **~848 `.sigml` files** (per workspace glob). Not every `SIGML_WORDS` entry may exist on disk; invalid paths surface as CWASA / status errors.
- SiGML is XML describing signing performance for the avatar pipeline.

### 5.4 CWASA / JAS tree (`public/jas/loc2021`)

- Full **legacy distribution**: HTML demos, JNLP, jars, shaders, `cwa/cwacfg.json`, etc.
- Default CWASA paths often assume **`./jas/loc2021`** relative to site root — satisfied here because Next serves `public/` at `/`.

---

## 6. Features (what the product can do today)

| Feature | Description |
|---------|-------------|
| Text to ISL animation | Sequential SiGML playback on 3D avatar |
| Multi-avatar | CWASA menu `CWASAAvMenu av0` + speed `CWASASpeed av0` |
| SOV display | Reordered word chips for user feedback (heuristic, not full NLP) |
| Voice input | Browser speech recognition; language select EN / HI / TA |
| Bilingual token hints | Small Tamil/Hindi → English map before SOV |
| Dataset explorer | Search + category filter + per-row play |
| Static hosting | All signing assets are static files; works offline after load (except remote fonts/analytics) |
| Vercel Analytics | Pageview instrumentation |

**Out of scope / not implemented:** server-side auth, user accounts, true ISL linguistics pipeline, fingerspelling for arbitrary unknown words (only single-letter path exists), Indian Sign Language **grammar** beyond simple SOV heuristics, subtitle export, video file export.

---

## 7. Configuration and environment notes

### 7.1 `next.config.mjs`

- **`turbopack.root`**: Set to this package directory so Turbopack does not pick a **parent** folder that also contains `pnpm-lock.yaml` (Windows drive roots often caused the “multiple lockfiles” warning).
- **`typescript.ignoreBuildErrors: true`**: Builds succeed even with TS errors — **technical debt**; enabling strict CI would require fixing types first.
- **`images.unoptimized: true`**: Typical for static export–style or fewer image optimizations.

### 7.2 Port 3000

- Dev and prod scripts **force port 3000**.
- On Windows, **another program bound to `127.0.0.1:3000`** (e.g. PgBouncer was historically misconfigured) can make **`http://localhost:3000`** hit the wrong service. Repo includes **`scripts/fix-pgbouncer-port.ps1`** (admin) to move PgBouncer to **6432** if needed.

### 7.3 Browser requirements

- **CWASA** expects WebGL / canvas or iframe paths depending on build — **Chrome / Edge / Safari** are the practical targets.
- Speech recognition requires **HTTPS or localhost** and a compatible browser.

---

## 8. Known limitations and optimization hooks

Use these as **prompt seeds** for LLMs:

1. **Single giant client component** (`isl-avatar-player.tsx` ~1000+ lines): hard to test, hard to tree-shake; split into hooks (`useCWASA`, `useSpeechRecognition`, `usePlaybackQueue`), presentational subcomponents, and pure modules for SOV + gloss resolution.
2. **Duplicated vocabulary sources:** `SIGML_WORDS` vs filesystem vs `ISL_DATASET` — could generate one manifest at build time (`fs.readdir` of `SignFiles`) and type-check coverage.
3. **SOV grammar** is regex/list-based and **English-centric**; edge cases and false verb detection are expected.
4. **Playback timing:** fixed `setInterval` / `playerAvailableToPlay` heuristics vs CWASA events — likely to desync; could bind to CWASA callbacks if exposed.
5. **Logging:** verbose `console.log` in production paths — gate with `process.env.NODE_ENV` or a debug flag.
6. **Global `window` mutations** (`playSign`, `tuavatarLoaded`): prefer `React.context` or a small event bus for dataset → player communication.
7. **`ISLAnimationPlayer`:** dead code from router’s perspective — remove or expose via `/demo` with a comment.
8. **`ignoreBuildErrors`:** turn off after fixing `Window` augmentation duplicates (`declare global` appears in two files) and any strict-null issues.
9. **Performance:** `allcsa.js` is multi‑MB — lazy route, service worker caching, or CDN versioning strategies could be discussed.
10. **Accessibility:** focus management, ARIA for custom tab buttons, keyboard control for dataset table.
11. **i18n:** UI strings are English-only; metadata could be localized.

---

## 9. “Prompt pack” for ChatGPT / other LLMs

Copy the block below into a new chat as **system or first user message** when you want high-quality answers about this repo:

```text
You are helping with a Next.js 16 + React 19 + TypeScript + Tailwind 4 repo for “Text to Indian Sign Language”.

Facts:
- Entry: app/page.tsx renders components/isl-avatar-player.tsx only.
- Signing: public/js/allcsa.js exposes window.CWASA; avatar div has classes CWASAAvatar av0; SiGML URLs are /SignFiles/<gloss>.sigml (lower case words, upper case single letters).
- Gloss pipeline: whitespace tokenization → optional Tamil/Hindi WORD_TRANSLATIONS → convertToSOV (heuristic English) → map to SIGML_WORDS or ISL_DATASET (isl-dataset.ts, ~1708 rows) → sequential playSiGMLURL with timers.
- Dataset tab: components/dataset-viewer.tsx; uses window.playSign defined in isl-avatar-player.tsx.
- Dead/unused route component: components/isl-animation-player.tsx (not imported by app).
- next.config.mjs: turbopack.root = project dir; typescript.ignoreBuildErrors true; images.unoptimized true.
- Dev: next dev -p 3000; many static assets under public/jas and public/SignFiles.

Constraints: Prefer minimal diffs, match existing patterns (client components, shadcn ui), do not invent a backend unless asked. When suggesting refactors, name exact files. When optimizing performance, consider CWASA bundle size and client-only execution.
```

**Example follow-up prompts:**

- “Split `isl-avatar-player.tsx` into X files; show imports and public API.”
- “Add a build-time script that lists all `public/SignFiles/*.sigml` basenames and fails CI if `SIGML_WORDS` references a missing file.”
- “Replace the custom tab buttons with shadcn Tabs and preserve CWASA DOM requirements.”
- “Design a `useSignPlaybackQueue` hook that uses Promise + CWASA completion instead of setInterval.”
- “Remove `ignoreBuildErrors` and fix all resulting TypeScript errors.”

---

## 10. Optional Windows maintenance

If **Postgres PgBouncer** was configured to listen on **port 3000**, it can break local Next.js on `localhost`. See **`scripts/fix-pgbouncer-port.ps1`** (run in an **elevated** PowerShell). The script writes UTF‑8 **without BOM** to avoid breaking PgBouncer’s ini parser.

---

## 11. License / third-party

- **CWASA / JAS** materials under `public/jas` and `public/js/allcsa.js` are **third-party** signing technology; verify **licensing and attribution** before redistribution or commercial use.
- This README does not assert a license for the whole repo; check repository root for `LICENSE` if present.

---

*Generated to document the state of the codebase for humans and LLMs. Update this file when architecture or data pipelines change materially.*
