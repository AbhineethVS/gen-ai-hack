# MASTERPLAN: Muthashi Kadha (മുത്തശ്ശി കഥ) — "Her story, her book, every child's library"

> Built for the BIA GenAI Hackathon 2026, theme **AI for Inclusive Kerala**.
> Solo build, 4 hours, working prototype + 3-minute demo.

---

## 0. Rules for the AI coding assistant (read first)

1. Follow this plan. Do NOT add features that are not listed under "MUST HAVE".
2. No auth, no accounts, no payments, no marketplace, no admin panel.
3. Every AI call must be server-side (API routes). Never expose keys in the browser.
4. Every AI step must have a **fallback** (see section 11). A blank screen during the demo is the worst outcome.
5. Prefer boring, fast-to-write code. Hackathon quality, but the UI must look polished.
6. Model names go in env vars, never hardcoded.
7. Ask before adding any dependency that is not listed in section 5.

### Design and quality bar (from the author)

I want this app to be as perfect as Linear's website or Apple Notes. Simple purpose, simple architecture, simple design, simple implementation. Cut taglines, helper text, and secondary labels if a screen needs them. If a screen needs them to make sense, fix the layout. Every decision should elevate the user experience, developer experience, and agent experience at once without breaking anything.

Clarifications so this does not conflict with the rest of the plan:
- Never cut: the consent checkbox text, the "AI-illustrated" and "Demo story" badges, the "Told by" credit, error messages, and the primary Malayalam label on each button (users are seniors and cannot rely on icons alone).
- Generating screen: the panels appearing one by one IS the progress indicator, plus one short line. No step checklist. This overrides section 6, step 4.
- Take from Linear: restraint, typography, spacing, subtle motion. Do not copy its dark, dense, keyboard-driven pro-tool look. This is a warm, large-type, light UI for seniors and children.
- "Without breaking anything": after every build step, `npm run build` passes and the main flow still works end to end.
- Polish never blocks the 3:30 feature freeze. If something is not done by then, cut it.

---

## 1. One-liner

A senior citizen narrates a story or memory in Malayalam. The app turns it into a 4-panel illustrated comic book, she reviews and edits it, and with one consent tap it is **auto-published to a free public library where any child can read it**.

**Pitch line:** *"Grandmothers become authors. Every child in Kerala gets a free story library."*

## 2. Problem and why it fits the brief

- Kerala has India's highest share of elderly people, and many live alone as children migrate. Isolation and feeling "unneeded" are real problems.
- Most "AI for seniors" tools treat seniors as **patients or helpless users** (medicine reminders, help desks). This treats them as **authors and teachers**.
- Malayalam children's content is scarce. Seniors hold stories, folk tales, and memories that are not written down anywhere.
- Brief keywords hit: *dignity, confidence, social inclusion, reduces barriers (voice instead of typing, no app navigation), simple user journey*.

**Honest framing for judges:** this scores on dignity and social inclusion, not on daily-task independence. Do not pretend it is a daily-assistant tool.

## 3. Users

- **Primary:** a senior (60+) who speaks Malayalam, is not comfortable typing, and has stories to tell. Demo persona: "Ammachi, 72, Thiruvananthapuram".
- **Secondary:** children (and parents/teachers) reading in the public library.
- **Out of scope:** caregiver dashboards, family accounts, moderation staff.

## 4. Scope

### MUST HAVE (the one end-to-end use case)
1. **Home screen:** one huge mic button + "Type instead" link. Nothing else.
2. **Voice or text input** of a story (Malayalam speech via Sarvam, or Manglish/Malayalam/English typed).
3. **Story to comic:** LLM produces title, character sheet, 4 panels (scene + Malayalam caption + optional dialogue for HTML speech bubbles).
4. **Image generation:** 4 panel images, in parallel, consistent style and character. Images leave empty space near the top for bubbles; no text baked into images.
5. **Book viewer:** page-by-page, captions and speech bubbles overlaid in HTML (NOT baked into images).
6. **Edit and regenerate:** per panel, she can edit the caption text and regenerate the image.
7. **Share flow:** consent checkbox + "Share with children" button, which runs the safety/anonymize check and then publishes.
8. **Public library page:** grid of books (3 seeded demo books + live ones), open any to read. Mobile-friendly. No login.
9. **QR code** on the last slide/screen pointing to the library.
10. **Labels:** "AI-illustrated" badge on every book; "Demo story" badge on seeded ones.

### STRETCH (only if everything above is polished)
- **"Listen" button** using Sarvam Bulbul (`bulbul:v3`) for read-aloud; cache audio in Supabase Storage. Only build it if a Malayalam voice works in testing.
- "Told by" photo/avatar. Language toggle ML/EN on captions.

### CUT (do not build)
Accounts, payments/storefront/earnings, Amazon/KDP integration, multi-story drafts, comments/likes, search, analytics, translation to other languages.

---

## 5. Tech stack (swap anything you are faster in)

- **Frontend + API:** Next.js (App Router) + TypeScript + Tailwind CSS. Deploy on Vercel (public URL needed for the QR demo).
- **DB + file storage:** Supabase (Postgres + Storage). Public-read bucket for panel images (and stretch: read-aloud audio).
- **LLM:** OpenAI chat model via env var `LLM_MODEL`, JSON-mode / structured output.
- **Image generation:** OpenAI image model via env var `IMAGE_MODEL`.
- **Speech to text:** Sarvam AI Saaras (`saaras:v3`). Browser records with MediaRecorder (WebM supported); server calls Sarvam. Key stays server-side. Fallback: typed input.
- **Speech synthesis (stretch):** Sarvam Bulbul (`bulbul:v3`) via `/api/speak`, audio cached in Supabase Storage.
- **Malayalam font:** Noto Sans Malayalam (Google Fonts). Must render correctly everywhere.
- **QR:** `qrcode` npm package (generate at build time or in the browser).

**Sarvam docs:** https://docs.sarvam.ai/llms.txt — and there is a docs MCP server at https://docs.sarvam.ai/_mcp/server. **Verify exact parameter names there before coding.**

### Env vars
```
OPENAI_API_KEY=
LLM_MODEL=
IMAGE_MODEL=
SARVAM_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
DEMO_MODE=false
```

### Repo structure
```
/app
  page.tsx                 # Home: big mic button
  create/page.tsx          # Steps: input -> review text -> generating -> book preview -> share
  library/page.tsx         # Public grid
  book/[id]/page.tsx       # Reader (works for private preview and public books)
  api/transcribe/start/route.ts   # upload audio -> sync text (<=30s) or batch job_id (>30s)
  api/transcribe/status/route.ts  # poll batch job by job_id
  api/speak/route.ts       # stretch: Bulbul TTS, cache audio in Supabase
  api/story/route.ts       # text -> structured story JSON (+ safety fields)
  api/panel/route.ts       # one panel -> image (called 4x in parallel, also used for regenerate)
  api/publish/route.ts     # safety gate + set is_public = true
/components                # MicButton, PanelCard, BookReader, BookCard, StepProgress
/lib                       # supabase.ts, prompts.ts, schema.ts, fallback.ts
/public/demo               # pre-generated backup images + demo-books.json
/scripts/seed.ts           # seeds 3 demo books into Supabase
```

---

## 6. User journey (screens)

1. **Home:** big mic button labelled in Malayalam ("കഥ പറയൂ" — "tell a story"). Small "Type instead" below.
2. **Recording:** MediaRecorder captures the whole story (cap 2 min, live timer on screen). Tap to stop. Then upload to `/api/transcribe/start`. Short clips (<=30s, including the ~25s live demo story) return text immediately; longer clips return a `job_id` and the UI polls `/api/transcribe/status` every 3s. Big "Done"/stop control; no live interim transcript.
3. **Review text:** transcript shown in large type. She can fix it (or leave it). Button: "Make my book".
4. **Generating:** progress shows each step ticking: "Understanding your story", "Drawing page 1/4"... Panels appear one by one as they finish (progressive reveal, not a spinner).
5. **Book preview:** page-by-page reader. Captions and HTML speech bubbles overlaid on the image. Each page has "Change words" and "Draw again". Top: title (editable).
6. **Share:** checkbox: "I want children to read my story for free." Button: "Share with children". Shows a friendly safety-check step, then success screen with a link and QR to her book.
7. **Library:** public grid. Her book appears first with a "New" tag.

Design rules: huge tap targets (min 56px), high contrast, max one primary action per screen, no menus, no jargon, warm colours. Mobile-first but must look great on a laptop projector.

---

## 7. Data model (Supabase)

```sql
create table books (
  id uuid primary key default gen_random_uuid(),
  title_ml text not null,
  title_en text,
  narrator_label text,              -- e.g. "Ammachi, Thiruvananthapuram" (no real names/addresses)
  original_text text,               -- raw input, never shown publicly
  character_sheet jsonb not null,
  is_public boolean default false,
  is_demo boolean default false,
  consent_at timestamptz,
  created_at timestamptz default now()
);

create table panels (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade,
  idx int not null,                 -- 1..4
  caption_ml text not null,
  caption_en text,
  scene_description text not null,
  dialogue jsonb not null default '[]',  -- 0-2 items: {speaker, text_ml}; rendered as HTML bubbles
  image_url text,
  unique (book_id, idx)
);
```
- Storage bucket `panels`: public read. Upload via service role in API routes.
- Library query: `books where is_public = true order by created_at desc`.
- Simplicity over security: public read on public books, writes only through API routes with the service role key.

---

## 8. AI pipeline

### Step A: `POST /api/story` (text to structured story)

Input: `{ text: string }` (Malayalam, Manglish, or English).

System prompt (use as is, tweak after testing):
```
You are a children's picture-book editor in Kerala. A grandparent has told you a
story or memory. Turn it into a gentle 4-panel illustrated story for children
aged 4-10.

Rules:
- The input may be Malayalam, Manglish (Malayalam written in English letters), or
  English. Understand it all. Output captions in natural, simple Malayalam
  (Malayalam script) with an English version too.
- Keep the grandparent's voice and the heart of the story. Do not invent a
  different plot. Keep it warm, simple, and short: each caption max 2 short sentences.
- Each panel may include a "dialogue" array of 0-2 short spoken lines
  ({speaker, text_ml}) for comic speech bubbles. Use dialogue only when a
  character clearly speaks; otherwise use an empty array. Keep lines very short.
- Create a single "character_sheet" for the main character(s) with fixed visual
  details (age, face, hair, clothing colours, accessories). Every panel must reuse
  it exactly so the character looks the same.
- Remove or generalise personal details: real full names (use a first name or a
  role like "Ammachi"), phone numbers, addresses, exact house/location details,
  and any identifying info. List what you removed.
- Child-safety check: set child_safe=false if the content includes violence,
  sexual content, self-harm, hate, or anything unsuitable for children, and
  explain in "issues". Mild sadness or a gentle moral is fine.
- Scene descriptions must be visual and concrete, in English, with NO text, signs,
  or lettering in the scene. Leave clear empty space near the top of the scene
  for HTML speech bubbles to be overlaid later.

Return ONLY valid JSON matching the schema.
```

Output schema:
```json
{
  "title_ml": "string",
  "title_en": "string",
  "character_sheet": {
    "name": "string",
    "description": "string, fixed visual details reused in every panel"
  },
  "panels": [
    {
      "idx": 1,
      "scene_description": "string (English, visual, no text in scene; leave empty space near the top for bubbles)",
      "caption_ml": "string (Malayalam script, max 2 short sentences)",
      "caption_en": "string",
      "dialogue": [
        { "speaker": "string", "text_ml": "string (short Malayalam line)" }
      ]
    }
  ],
  "safety": {
    "child_safe": true,
    "issues": ["string"],
    "removed_personal_details": ["string"]
  }
}
```
Validate with zod. `panels` must have exactly 4 items; each `dialogue` array has 0–2 items; retry once on invalid JSON.

### Step B: `POST /api/panel` (one panel to image)

Called 4 times in parallel (`Promise.allSettled`). Also used by "Draw again".

Image prompt template (build in `lib/prompts.ts`):
```
{STYLE_PREFIX}
Main character (keep identical in every panel): {character_sheet.description}
Scene: {scene_description}
Setting: Kerala, India. Warm, gentle, child-friendly.
Leave clear empty space near the top of the image for speech bubbles to be overlaid later.
Do NOT include any text, letters, words, speech bubbles, signs or watermarks.
Square composition.
```
`STYLE_PREFIX` (one constant, never changes between panels):
```
Warm watercolour children's picture-book illustration, soft colours, gentle
lighting, simple shapes, consistent character design, no text.
```
- If the image API supports reference images, pass panel 1 as reference for panels 2-4 (generate panel 1 first, then 2-4 in parallel). If not, rely on the identical style prefix + character description.
- Upload result to Supabase Storage, store `image_url`.
- **Captions and dialogue are NEVER rendered inside images.** Image models mangle Malayalam script. Captions and speech bubbles are HTML overlaid by the reader.

### Step C: `POST /api/publish` (consent + safety gate)
1. Require `consent === true`. Store `consent_at`.
2. Re-check `safety.child_safe === true` (also re-run a quick moderation call on final captions after any edits).
3. If it fails, return a friendly message: "This story needs a little change before children can read it" with the reason. Do not publish.
4. On success: `is_public = true`, return the public URL.
5. `original_text` is never exposed in public queries.

---

## 9. Voice input details (Sarvam AI)

Do **not** use the browser Web Speech API. Record, then transcribe server-side with Sarvam.

**Client flow**
1. Tap the mic → start `MediaRecorder` (WebM is supported). Cap recording at **2 minutes**. Show a **live timer**. Tap again to stop.
2. `POST /api/transcribe/start` with the audio blob.
3. If the response includes transcript `text` → show the review screen.
4. If the response includes `job_id` → poll `GET /api/transcribe/status?job_id=...` every **3 seconds** until text is ready.
5. **Never wait for a batch job inside a single serverless request.** Start returns immediately with either text or a job id; status is a separate short request.

**Server: `/api/transcribe/start`**
- Auth header uses `SARVAM_API_KEY` (server-side only; never expose to the browser).
- If audio duration **<= 30s**: call Sarvam **sync** REST `POST https://api.sarvam.ai/speech-to-text` with model `saaras:v3`, mode `transcribe`, language Malayalam `ml-IN`. Return the text immediately.
- If audio is **longer than 30s**: create a Sarvam **batch** job and return `{ job_id }`. Do not block on completion.
- The live demo story is ~**25s**, so it takes the fast sync path.

**Server: `/api/transcribe/status`**
- Look up the batch job by `job_id`. Return status / text when ready.

**Fallback**
- If a job takes over **60s** or fails, show the typed box with the sample Malayalam story prefilled (same as the "Try a sample story" path).
- Keep a **pre-written Malayalam demo story** ready to paste if recording or Sarvam fails on stage.
- Typed input (Manglish accepted) remains the hard fallback; the LLM prompt already handles Manglish.

**Verify before coding:** exact Sarvam parameter names at https://docs.sarvam.ai/llms.txt (or the docs MCP at https://docs.sarvam.ai/_mcp/server).

---

## 10. Safety, consent, and responsible AI (say this in the pitch)

- She is the author. Nothing is published without her explicit consent tap.
- Every book shows an **"AI-illustrated"** badge. Seeded stories show **"Demo story"**.
- Automatic checks before publishing: child-safety check, and removal of personal details (names, phones, addresses).
- No accounts, no tracking, no data collection from children.
- Original raw input is stored privately and never shown publicly.
- Be upfront: the library is seeded with demo stories for the hackathon.

---

## 11. Failure handling (non-negotiable)

| Failure | Fallback |
|---|---|
| Mic / MediaRecorder unsupported or permission denied | Show text box, with the Malayalam demo story prefilled via a "Try a sample story" button |
| Sarvam sync/batch fails, or batch job takes >60s | Show typed box with sample Malayalam story prefilled; do not hang the UI |
| LLM returns invalid JSON | Retry once, then use a cached sample story JSON |
| One panel image fails | Show that panel with a "Draw again" button; other panels stay visible |
| Image generation is slow | Progressive reveal: show each panel as soon as it finishes, with skeleton placeholders |
| Everything breaks on stage | `DEMO_MODE=true` serves pre-generated book from `/public/demo`, and the backup video plays |
| Supabase/network down | Library falls back to `demo-books.json` |

---

## 12. Seed data (do this while the app builds)

- Pre-generate **3 complete demo books** (4 panels each) using your own pipeline, using different short Malayalam folk-tale-style stories. Save images under `/public/demo` and also seed them into Supabase with `is_demo = true`.
- Pre-generate **1 backup version of the live demo story** so the "book appears" moment works even if generation is slow.

---

## 13. Build order for Cursor (with "done when")

1. **Scaffold + deploy.** Next.js + Tailwind + Supabase client, deployed to Vercel with a hello page. *Done when:* public URL loads.
2. **Risk test (20 min).** `/api/story` with a hardcoded sample; MediaRecorder → `/api/transcribe/start` on a short Malayalam clip (sync path); generate 3 panels and check character consistency. *Done when:* you know whether Sarvam voice works and whether panels look consistent. **Decision point: if voice is flaky, go typed-first.**
3. **Story pipeline.** `/api/story` with zod validation (including `dialogue` 0–2). *Done when:* a pasted story returns valid 4-panel JSON with optional dialogue.
4. **Panel pipeline.** `/api/panel`, parallel calls, Supabase upload, progressive UI. *Done when:* 4 panels appear one by one.
5. **Book reader.** Page-by-page, HTML captions + speech bubbles, edit caption, "Draw again". *Done when:* you can flip through a generated book and fix a panel.
6. **Share + publish + library.** Consent, `/api/publish`, `/library`, public reader, "New" tag. *Done when:* a book published on one device appears on another device.
7. **Seed script + fallbacks + DEMO_MODE.** Also wire batch poll path for long recordings.
8. **Polish pass** (see below). Stretch: "Listen" via `/api/speak` (Bulbul) only if Malayalam voice quality is good in testing.
9. **QR code + demo rehearsal + backup video.**

### Polish checklist (spend real time here)
- [ ] Noto Sans Malayalam loads and looks good; line-height generous for Malayalam script
- [ ] Huge buttons, high contrast, one action per screen
- [ ] Skeleton loaders and friendly progress text (in Malayalam and English)
- [ ] Smooth panel reveal animation, page-turn feel in the reader
- [ ] Mobile layout checked on a real phone
- [ ] Empty/error states with friendly language (never raw errors)
- [ ] Library cards: cover = panel 1, title, "Told by", badges
- [ ] Favicon, page titles, OG image for the library link
- [ ] No console errors, no layout shift on load

---

## 14. Timeline (4 hours)

| Time | Goal |
|---|---|
| 0:00-0:30 | Read the PS and rubric, scaffold + deploy, risk tests (Sarvam 20s sync + 90s batch timing, panel consistency) |
| 0:30-1:45 | Story + panel pipeline (incl. dialogue/bubbles), book reader |
| 1:45-2:30 | Share flow, safety gate, library, seed demo books (generate while coding) |
| 2:30-3:30 | Polish checklist, fallbacks, DEMO_MODE; stretch Listen/Bulbul only if ahead |
| 3:30-4:00 | Freeze features, record backup video, rehearse the pitch twice |

**Feature freeze at 3:30.** After that: bugs and polish only.

---

## 15. Demo script (3 minutes)

1. **(0:00-0:25) The hook.** "In Kerala, 16 in every 100 people are over 60, and many live alone while their children work abroad. They have stories no one has written down." (Verify the figure before you use it; see section 17.)
2. **(0:25-1:10) Live demo.** She (or you, as Ammachi) records a short Malayalam story (~25s, sync path). Transcript appears after Sarvam returns. Click "Make my book". Panels appear one by one.
3. **(1:10-1:35) Control.** Edit one caption, redraw one panel. "She is the author. She decides."
4. **(1:35-2:05) Share.** Tick the consent box, "Share with children". Show the safety check step. Book appears at the top of the library.
5. **(2:05-2:30) The close.** Show the QR code: "Open it on your phone." Judges read her story.
6. **(2:30-3:00) Impact + next.** "Next: partner with schools, libraries, anganwadis; add read-aloud and more Kerala languages." Mention what is simulated (seeded demo stories).

### Likely judge questions
- **"Why not just use ChatGPT?"** She cannot type or navigate it. This is voice-first, one button, built for her, with safety, consent, and a publishing destination.
- **"Who reads it?"** Children, parents, and teachers, free. Malayalam children's content is scarce.
- **"Is it safe for kids?"** Automatic child-safety and personal-detail checks before anything goes public, plus her explicit consent. State honestly that a human moderation layer would be needed at scale.
- **"Who owns the story?"** She does. Consent is explicit and she is credited. Future: ability to unpublish.
- **"How does this scale or sustain?"** Partnerships with schools/libraries/NGOs; a free public good first.
- **"Is the voice input accurate?"** Be honest: we use Sarvam AI for Malayalam speech-to-text (record then transcribe), and there is a typed fallback if it fails or is slow.

---

## 16. Pitch positioning

Lead with **dignity and social inclusion**: seniors as authors, not patients. Do not oversell independence-of-daily-tasks. Mention that this is a different angle from medicine and help-desk assistants. Prior art exists for "AI turns elders' memories into a biography" (e.g. phone-call-based projects), so differentiate on: **Malayalam-first, comic format, child-facing free library, and consent plus safety flow.**

---

## 17. Pre-flight checklist (night before / first 30 minutes)

- [ ] OpenAI key works for both `LLM_MODEL` and `IMAGE_MODEL`, with credits, and rate limits are fine for 4 parallel image calls
- [ ] `SARVAM_API_KEY` works; test a **~20s** Malayalam clip (sync path) and a **~90s** Malayalam clip (batch + poll), and **time both paths**
- [ ] Supabase project, `books`/`panels` tables (incl. `dialogue` jsonb), public `panels` bucket
- [ ] Vercel project connected, env vars set (including `SARVAM_API_KEY`)
- [ ] Chrome on the demo laptop, mic permission granted, MediaRecorder (WebM) recording tested
- [ ] Hotspot ready as backup for venue wifi
- [ ] Verify the Kerala stat (60+ share) from a recent source before putting a number on a slide
- [ ] Pre-written Malayalam demo story in a text file (~25s when spoken, for the sync path)
- [ ] Backup demo video recorded after the first full successful run
- [ ] (Stretch) Bulbul Malayalam voice tested; only ship "Listen" if quality is good
