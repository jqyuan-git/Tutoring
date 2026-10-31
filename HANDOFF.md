# HANDOFF — Firm Foundation Tutoring Site

Working notes for continuing this build in a local Claude Code session.
**Delete this file once the site is finished** — it is scaffolding, not documentation.

---

## Current state (updated in Session 6 — see "Session 6 handoff" below)

**Build step 1 of 5 is complete and live.** All seven pages are scaffolded with
hardcoded data and full styling, pushed to GitHub, and served via GitHub Pages.

**Steps 2–4 (Firebase, public data, admin auth, security rules) are code-complete
but untested against real tutor data.** Firebase project `firm-foundation-tutors`
exists, Firestore is live, security rules are deployed, and `tutors.js`/`admin.js`
are written and locally smoke-tested (see "Session 3 handoff"). What's still
missing: no tutor documents exist in Firestore yet, so the public pages are
still showing their step-1 hardcoded fallback content (this is by design — see
"Public page behavior" below — but it means nobody has seen real data flow
through end-to-end). See "Session 3 handoff" near the bottom for exact next steps.

```
Tutoring/
├── index.html          hero + what we cover + tutor previews + CTA
├── tutors.html         full profile per tutor
├── services.html       rates table + format/payment/cancellation policy
├── resources.html      curated free external study links
├── faq.html            accordion FAQ (Session 4, no JS — native <details>)
├── booking.html        tabs per tutor → Google Calendar links
├── contact.html        one mailto card per tutor (static, not Firestore)
├── admin.html          login form (Google + email/password) + edit form
├── 404.html            custom not-found page (Session 4)
├── robots.txt          Session 4 — disallows admin.html, points to sitemap
├── sitemap.xml         Session 4 — lists all public pages
├── css/style.css       complete design system, ~1000 lines
├── js/main.js          nav toggle + accessible tabs (FF.initTabs)
├── js/firebase-config.js   web config for project firm-foundation-tutors
├── js/tutors.js         fetches `tutors` collection, renders public pages
├── js/admin.js          Google/email login, load + save own tutor doc
├── scripts/dev-server.js   Session 4 — zero-dependency local static server
├── .claude/launch.json  Session 4 — lets the Browser pane run dev-server.js
├── firestore.rules      public read, self-only update, no create/delete
├── firebase.json / .firebaserc / firestore.indexes.json
├── images/             favicon.svg only (Session 4) — no tutor photos supplied
└── HANDOFF.md          this file
```

Verified rendering at 1280px and 360px in Chromium. Fonts, blueprint grid,
hairline rules, tabular figures all confirmed working.

---

## Project brief (authoritative)

Static frontend on GitHub Pages, Firebase for tutor-editable content.
**No build tools, no npm, no frameworks** — plain HTML, CSS, and vanilla JS
using Firebase's ES module CDN imports.

### Brand

| | |
|---|---|
| Name | Firm Foundation |
| Tagline | Training the mind to think |
| Subhead | Math, biology, and physics tutoring |

The name has a quiet Christian resonance the church community will recognize,
but reads as "solid fundamentals" to everyone else. **Do NOT make the site
overtly religious.** No verses, no crosses, no faith language anywhere.

### Audience

Parents of middle and high school students. They are paying. Read as organized,
credible, professional — not playful, not trendy, not a student side project.

### The people

1. **Joshua Yuan** — Physics & Science. Credential: High school physics teacher.
   Bio: "Focuses on building conceptual understanding first. Students should
   leave able to explain the reasoning, not just reproduce steps."
2. **Janissa Yuan** — Biology, Chemistry. Credential: "Master's candidate in
   Biology at Grand Canyon University. B.S. in Biology from Cal State Long
   Beach." Bio: "Breaks down topics like genetics, cellular processes,
   evolution, and physiology using diagrams and worked examples rather than
   just definitions. Also helps students build the study habits and
   test-taking strategies that carry over past a single unit." (filled in
   from her resume, Session 3 — she has real AP Biology/Honors Chemistry
   tutoring experience already)
3. **James Yim** — Math (through AP Calculus). Credential: "Biology major at
   UC Davis. Completed AP Calculus AB & BC." Bio: `[PLACEHOLDER]`

> **CRITICAL:** Only Joshua is a classroom teacher. Do NOT write site-wide copy
> claiming "our teachers" or "taught by classroom teachers." Credibility lives
> on each individual profile, never in blanket claims.

### Design direction — "Blueprint"

```css
--navy-deep:   #042C53   /* hero background, header, footer */
--navy:        #0C447C   /* headings on light backgrounds */
--blue-mid:    #378ADD   /* links, interactive accents */
--blue-light:  #B5D4F4   /* secondary text on navy */
--blue-pale:   #85B7EB   /* tertiary text on navy, grid lines */
--paper:       #F7F9FC   /* page background */
--white:       #FFFFFF   /* cards */
--rule:        #D6E2EF   /* hairline borders */
```

Type: **Source Serif 4** (500/600) headings, **Inter** (400/500) body, via
Google Fonts. Tabular figures for rates.

Structure: faint blueprint grid on the **hero only** (~26px hairlines, very low
opacity). Corner radius 3–4px, squared drafting feel. Hairline horizontal rules
between sections rather than wrapping everything in cards. Left-aligned
throughout. No gradients, no drop shadows, no animation beyond hover color.

Quality floor: responsive to 360px, hamburger below 800px, visible keyboard
focus, `prefers-reduced-motion`, semantic HTML, proper heading hierarchy, alt text.

---

## Decisions already made (confirm or override)

| Decision | What was done | Why |
|---|---|---|
| **Rates** | Joshua $60, Janissa $35, James $35 | Set from 2026 Irvine, CA private-tutor market averages (general average ~$41/hr, math tutors ~$31-32/hr, STEM running 15-30% above humanities). Joshua priced above average to reflect his credentialed classroom-teacher status; Janissa and James priced near the local average as non-teacher tutors. Still confirm these match what you actually want to charge. |
| **Format** | `Both` for all three | Matched the example JSON in the brief. |
| **Contact emails** | Hardcoded in `contact.html`, not Firestore | Keeps the `tutors` collection to public profile data, and gives the admin form one less field for non-technical tutors to manage. |
| **Body-text neutrals** | Added `--ink #12243A`, `--ink-soft #4A5F78` | The brand palette covers headings and accents but had no long-form reading color. |
| **Tutor photos** | None | No images were supplied. `images/` is empty. |
| **Admin page inside an iframe (e.g. embedded in Canvas)** | Detects `window.self !== window.top` and shows a plain "Open in a new tab" button instead of attempting sign-in inline | Google (and most identity providers) block or unreliably support OAuth popups inside third-party iframes as an anti-clickjacking measure — this isn't fixable from our side, so the page just routes around it. Public pages have no such restriction and can be embedded anywhere without changes. |
| **Admin login method** | Google Sign-In **and** Email/Password, both live now. Phone sign-in was enabled in the Firebase Console but deferred — not wired into `admin.js` yet (needs a billing/reCAPTCHA check first, see below) | Decided in Session 3, revised twice. Google needs no password management; Email/Password is kept for tutors who'd rather use one, and lets Joshua pre-create accounts with temp passwords per the original plan. Both are tutor-only logins on `admin.html` — no parent-facing login exists (see "Ideas for later" below). Consequence for Google-only sign-ins: that Auth account's UID doesn't exist until the tutor signs in once, unlike an email/password account Joshua can pre-create. |
| **Payment method** | Venmo — each tutor sets their own Venmo link via `admin.html` (`venmo` field, same pattern as `linkedin`), shown as a "Pay via Venmo" button on their `tutors.html` profile and `booking.html` panel | Decided in Session 3. Keeps money entirely between each tutor and the family — the site never touches payment itself. `services.html`'s payment section now just names Venmo as the method and points to the per-tutor buttons rather than showing one shared account. |

### Two bugs found and fixed during step 1

- Header "Book a session" button inherited the pale nav-link blue on white —
  effectively unreadable. Now navy on white (~15:1). See the
  `.site-nav a.btn-invert` block in `style.css`.
- Wordmark tagline wrapped to two lines below 480px and bloated the header.
  Hidden on small phones; the footer still carries it.

---

## Settled

- **`jqyuan-git` is a GitHub *organization***, not Joshua's personal account.
  His personal account is `jqyuan` (member of that org). `gh` (GitHub CLI) is
  authenticated as `jqyuan` — that's correct and fine, but it means
  `gh repo create <name>` alone creates the repo under the *personal* account.
  For this project you must explicitly say `gh repo create jqyuan-git/<name>`.
  (A repo was accidentally created under `jqyuan` first, then deleted and
  recreated correctly under `jqyuan-git` — if you see stray repos under the
  personal `jqyuan` account, that's why.)
- **Repo (done):** `https://github.com/jqyuan-git/Tutoring` — public, pushed, live.
- **Local clone (done):** `C:\Users\joshu\OneDrive\Documents\GitHub\Tutoring`
  (moved here from an initial scratch copy in `Downloads\Tutoring` — the empty
  shell of that old folder may still linger; see gotchas below).
- **GitHub Pages (done):** enabled via `gh api`, serving from `master` branch,
  root path. **Live URL:** `https://jqyuan-git.github.io/Tutoring/` — confirmed
  working with real styling.
- Relative paths are already used throughout, so the site works under the
  `/Tutoring/` subpath with no changes.

## Open questions — need Joshua's answers before proceeding

1. ~~Joshua also tutors math~~ Resolved: modeled as a **second entry in his
   `services` array** (`subject: "Any high school math"`), same $60/hr rate as
   his physics service, no level restriction — he covers any HS math level, so
   there's deliberate overlap with James's range. Reflected in `tutors.html`
   (second spec-list block on his profile), `services.html` (second table row),
   and `index.html` (his subject cell + tutor-preview card).
2. ~~Confirm the three rates.~~ Updated to Joshua $60, Janissa $35, James $35
   (based on 2026 Irvine, CA tutoring market averages) — still worth a sanity check.
3. ~~Janissa also tutors Chemistry~~ Resolved (Session 3): her resume showed
   real Honors Chemistry tutoring experience, not just Biology. Added as a
   **second entry in her `services` array** (`subject: "Chemistry"` — shown
   without "Honors" per Joshua's request),
   same $35/hr rate as Biology. Reflected the same way Joshua's second
   subject was: `tutors.html` (second spec-list block), `services.html`
   (second table row), `index.html` (her subject cell gained a mention +
   her tutor-preview card subject line), `booking.html` and `contact.html`
   subject lines. Her resume also showed Writing tutoring experience —
   deliberately **not** added, since that's a bigger departure from the
   site's stated "math, biology, physics" positioning than Chemistry is;
   left for a future explicit decision if wanted.

---

## Ideas for later (not in scope now)

- **Parent login.** Joshua mentioned potentially wanting parents to be able
  to log in too (e.g. phone-based accounts), separate from the tutor admin
  login. No purpose/feature has been defined yet — don't build this until
  there's a concrete use case (progress view? booking history?) to scope it
  against. Noted here so it isn't forgotten, not because it's approved work.

---

## Remaining build order

### Step 2 — Firebase on public pages

Firebase v10+ modular SDK via CDN ES module imports. No bundler.
Services: Authentication (email/password) and Cloud Firestore.

Put the web config in `js/firebase-config.js` with clearly marked placeholders.
**Add a comment noting Firebase web config keys are safe to commit publicly —
security comes from Firestore rules.**

**Data model.** Collection `tutors`, document ID = the tutor's Firebase Auth UID:

```json
{
  "name": "Joshua Yuan",
  "credential": "High school physics teacher",
  "bio": "Focuses on building conceptual understanding first...",
  "linkedin": "https://www.linkedin.com/in/joshua-yuan-716238281",
  "order": 1,
  "active": true,
  "services": [
    {
      "type": "tutoring",
      "subject": "Physics & Science",
      "rate": 45,
      "format": "Both",
      "bookingUrl": "https://calendar.google.com/..."
    }
  ]
}
```

- `format` is one of: `"In person"`, `"Video"`, `"Both"`
- `services` is an **array** so a tutor can offer multiple things. Every tutor
  currently has one entry with `type: "tutoring"`. **Type `"athletics"`
  (basketball and volleyball training) is planned — build the rendering so
  additional services appear automatically with no code changes.**
- `active: false` hides a tutor from public pages without deleting the record
- `order` controls display sequence
- `linkedin` is **optional** (added Session 3, at Joshua's request) — a
  tutor sets their own via the "LinkedIn URL" field on `admin.html`. When
  present, `tutors.html` shows a "View LinkedIn" button on that tutor's
  profile. `firestore.rules` only checks it's a string when present;
  `admin.js` and `tutors.js` both separately reject anything that isn't an
  `http`/`https` URL before it can end up in an `href` — otherwise a
  malicious value like `javascript:...` in that field could execute script
  for any visitor who clicked the button.

**Public page behavior.** Fetch tutor data once per page load, ordered by
`order`, filtered to `active: true`. Show a lightweight loading state, not a
blank page. **If the Firestore fetch fails, render a hardcoded fallback with the
three tutors' names and subjects plus a note to contact directly. The site must
never appear broken.** The step-1 hardcoded markup is exactly this fallback —
keep it.

Files: `js/firebase-config.js`, `js/tutors.js` (fetch + render).
DOM hooks already in place: `#subjects-grid`, `#tutor-preview`, `#tutor-profiles`,
`#rates-body`, `#booking-tabs`, `#booking-panels`, `#contact-grid`.

> `booking.html` must **not** iframe-embed Google Calendar appointment pages —
> many accounts block framing. Use a link button opening in a new tab. Already
> built this way.

### Step 3 — `admin.html` and the auth flow

Not logged in: "Sign in with Google" button plus an email + password form,
clear error messaging. (Phone sign-in is enabled in Firebase but not wired up
yet — add later.) Logged in: a form pre-filled with **only that tutor's own
record**. Editable —
credential, bio, and per service: subject, rate, format, bookingUrl. Allow
adding and removing services. Save writes to Firestore with success/error state.
Log out button.

**Nobody should be able to see or edit another tutor's record from this page.**
Keep the UI simple — Janissa and James are not technical.

File: `js/admin.js`. The UI shell already exists in `admin.html`.

### Step 4 — `firestore.rules` and README

Rules:
- Anyone (unauthenticated) can **READ** documents in `tutors`
- An authenticated user can **UPDATE** only the document whose ID equals their own UID
- **No client-side CREATE or DELETE** — tutors are added manually in the console
- Validate on write that `rate` is a number and required fields exist

README must include:
1. What this project is, in two sentences
2. Step-by-step Firebase setup: create project, enable email/password auth,
   create three users, create Firestore in production mode, add three docs using
   the Auth UIDs, deploy the rules file, copy web config into `js/firebase-config.js`
3. Example Firestore document JSON to paste in
4. Google Calendar Appointment Schedule setup steps for each tutor
5. GitHub Pages deploy steps
6. A short "how to update your info" section for a non-technical tutor —
   just: go to /admin, log in, edit, save
7. A checklist of remaining placeholders

### Step 5 — git, repo, push, enable Pages

Ask Joshua for his GitHub username first.

---

## Firebase provisioning (run locally — MCP required)

**Do these directly via MCP or the `firebase` CLI rather than handing over
instructions. Confirm each step with Joshua before running it.**

1. Create a Firebase project (or ask which existing one to use)
2. Register a web app and pull the config into `js/firebase-config.js`
3. Enable both Google and Email/Password as sign-in providers
4. For tutors who'll use Email/Password: create their Auth user directly with
   a temporary password Joshua can share. For tutors who'll use Google: they
   need to sign in once via the deployed `admin.html` Google button (or a
   temporary test page) before their Auth user + UID exist — **ask Joshua
   which method each tutor prefers, and for Google users, their Google
   account email** so he knows which one to expect in the Console
5. Create Firestore in production mode
6. Create the three tutor documents using the real Auth UIDs (found in
   Authentication → Users in the Console)
7. Write and deploy `firestore.rules`

**Still include the manual setup steps in the README as a fallback.**

---

## Session 2 handoff — resume here

Everything above through GitHub Pages going live was completed and verified.
This session then started on Step 2 (Firebase) and got partway through setup
before being cut off. Exact state:

### Where to pick up

1. **Firebase CLI login was started but not finished.** Running `firebase
   login` printed a URL + session ID and is waiting on a manual authorization
   code (this machine/session has no way to auto-complete the browser
   redirect, so it fell back to the manual-code flow). Nobody ever supplied
   the code back, so **Joshua is not logged in yet.** To resume: run
   `firebase login` again (old session codes expire), have him open the
   printed URL, sign in with the Google account tied to the Firebase project,
   copy the authorization code shown at the end, then run
   `firebase login <that code>` to finish.
2. Once logged in, run `firebase projects:list` to see what Firebase projects
   already exist, and ask Joshua whether to use an existing one or create a
   new one — **do not assume.**
3. Then proceed through the 7 numbered provisioning steps just above.

### Environment gotchas discovered this session (don't rediscover these)

- **Two Claude Code hooks are broken** and error on nearly every Bash/Read
  call: `gsd-validate-commit.sh` and `gsd-read-injection-scanner.js` (both
  under `.claude/hooks/`, invoked with Windows `&`-call syntax in what's
  apparently expecting a POSIX shell). Noisy but not blocking — flagged to
  Joshua twice, never fixed. Worth fixing if it keeps being annoying.
- **Node.js on this machine is v25.9.0**, newer than what `firebase-tools`
  officially supports (20/22/24 — triggers an `EBADENGINE` warning on every
  install/run via the `superstatic` dependency). Nothing has broken yet, but
  if Hosting-related Firebase commands misbehave, this is the first suspect.
- **`claude mcp add` has a parsing bug**: any argument after the `--`
  separator that starts with a dash (e.g. `-y`, `--dir`) makes it fail with
  `error: unknown option`, even though those flags are meant for the
  subprocess, not for `claude mcp add` itself. Workaround used: install
  `firebase-tools` globally (`npm install -g firebase-tools`) and register the
  server as plain `firebase mcp` with no flags:
  `claude mcp add firebase-mcp -- firebase mcp`. It registered fine but
  **`claude mcp list` showed it as "Failed to connect — timed out after
  30000ms"** — untested whether finishing the Firebase login above fixes
  this; check `claude mcp list` again after login.
- **GitHub CLI account:** `gh` is authenticated as personal account `jqyuan`
  (see "Settled" above for why that's fine but requires explicit
  `jqyuan-git/<repo>` naming).
- **Harmless leftover:** `C:\Users\joshu\Downloads\Tutoring` is an empty
  folder that resisted deletion all session (persistent file lock — likely
  OneDrive backup, antivirus, or an open Explorer window). Not the real
  project; safe to ignore or delete manually later.

---

## Session 3 handoff — resume here

Firebase CLI login was completed (account `cjaaa100@gmail.com`). Project
creation via the `firebase` CLI hit a `PERMISSION_DENIED` when attaching
Firebase to a Google Cloud project — this looked transient but wasn't; it's a
new-account restriction that only the Firebase Console web UI could get past.
Same story for the Firestore database itself: `firebase firestore:databases:create`
failed with "Cloud Firestore API has not been used in project ... before or is
disabled" even after retrying, so that also had to be created via the Console.
**If a future session hits `PERMISSION_DENIED` or "API not enabled" errors
provisioning a brand-new Firebase project via CLI/API, don't retry the same
command — go straight to console.firebase.google.com and do that one step
there, then resume with the CLI.**

### What's done

- Firebase project: **`firm-foundation-tutors`** (created via Console after
  CLI creation failed), linked in `.firebaserc` as the default project.
- Web app registered; config written to `js/firebase-config.js`.
- Sign-in providers enabled: **Google** and **Email/Password** (Phone was also
  enabled in the Console but intentionally not wired into `admin.js` yet —
  see the "Admin login method" decision above).
- Firestore created: Standard edition, Firestore Native, `nam7` (West Coast US
  multi-region — Joshua is in Irvine, CA), no backups (fine for a
  3-document collection Joshua can recreate by hand).
- `firestore.rules` written and **deployed** (public read, self-only update
  with field validation, no client create/delete). `firebase.json` and
  `firestore.indexes.json` also added (`indexes: []` — the public fetch
  intentionally avoids needing a composite index; see next section).
- `js/tutors.js` written and wired into `index.html`, `tutors.html`,
  `services.html`, `booking.html` (not `contact.html` — emails stay static
  per the existing decision). Fetches all `tutors` ordered by `order`,
  filters `active` client-side in JS rather than in the Firestore query
  (avoids needing a composite index for a 3-document collection). Builds all
  DOM nodes via `createElement`/`textContent`, never `innerHTML` — tutor bios
  and credentials will eventually be tutor-editable, so they're treated as
  untrusted text, not HTML. On fetch failure or an empty result, it does
  nothing and leaves the page's hardcoded step-1 markup exactly as it was —
  that markup **is** the required fallback.
- `js/admin.js` written and wired into `admin.html`. Google popup sign-in and
  email/password sign-in both call through to real Firebase Auth; loads the
  signed-in user's own doc by UID and shows a friendly message (not a broken
  page) if no doc is linked yet; save writes only `credential`, `bio`, and
  `services` (never `name`/`order`/`active`) via `updateDoc`, so those fields
  are preserved untouched and still satisfy the rules' validation, which
  checks the full resulting document. The services editor supports add/remove
  and was built generically off whatever's in Firestore — no code changes
  needed when the planned `athletics` service type shows up.
- Local smoke test (static file server + gstack headless browser): homepage
  loads with no console errors and correctly falls back to hardcoded content
  (no Firestore docs exist yet, so `tutors.js` fetches an empty array and
  bails, as designed). `admin.html` loads with no console errors, both login
  options render, and submitting deliberately wrong email/password
  credentials round-trips to real Firebase Auth and shows the friendly error
  message. Google sign-in itself couldn't be completed in headless Chromium
  (a `Cross-Origin-Opener-Policy policy would block the window.closed call`
  console warning showed up), but **was subsequently confirmed working in a
  real browser on the live GitHub Pages site** — it needed
  `jqyuan-git.github.io` added to Firebase Console → Authentication →
  Settings → Authorized domains first (not on that list by default; only
  `localhost` and the project's own `*.firebaseapp.com` domain are). Joshua
  signed in successfully afterward and got the expected "no profile linked
  yet" message, confirming the whole chain works end-to-end. His UID is
  `da9pYiV86jOXHWJYilCyPDF2P8R2` (found via `firebase auth:export`), and his
  tutor document now exists (created manually via the Console's
  "Start collection" flow).

  **For any future direct Firestore edits that can't go through admin.html**
  (e.g. adding a field to an existing doc): don't try to reuse the `firebase`
  CLI's own login session to call the Firestore REST API directly — that's
  inappropriate credential use and gets blocked. **Google Cloud Shell is the
  right tool for this** — it's a real terminal in the browser, already
  authenticated as whoever opened it, with `gcloud` preinstalled. From there,
  `gcloud auth print-access-token` gives a valid bearer token for that
  person's own session, which works directly against the Firestore REST API.
  Always pass `updateMask.fieldPaths=<field>` for each field being touched —
  a PATCH without an update mask replaces the *entire* document with only
  the fields in the request body, silently deleting everything else. Used
  successfully this session to add `linkedin` and `venmo` to Joshua's
  existing document without disturbing anything else on it. ("Gemini in
  Firebase" was tried first as a lower-effort alternative but didn't
  actually make the edit — Cloud Shell is the reliable fallback.)

### Where to pick up

1. **No tutor documents exist in Firestore yet.** The public pages are still
   showing step-1 hardcoded content because of this, not because of a bug.
2. Proceed through the "Firebase provisioning" numbered list above,
   starting from step 4 (getting each tutor's Auth account set up) — steps
   1–3 and 5–7 are already done.
3. Once at least one tutor doc exists, reload the public pages and confirm
   real data actually renders (this hasn't been seen working end-to-end yet,
   only smoke-tested against an empty collection).
4. Actually complete a real Google sign-in on `admin.html` in a normal
   (non-headless) browser to confirm that path works, then test saving a
   change and confirming it appears on the public pages.
5. Continue into Step 4's remaining piece (README) and Step 5 (this repo is
   already pushed and Pages is already live from step 1, so Step 5 may
   already be effectively done — just double check).

---

## Session 4 handoff — resume here

This session added site features beyond the original 7-page build, rather
than continuing Firebase provisioning. Nothing about the Firebase/Firestore
state described in "Session 3 handoff" changed — that section is still
accurate and still the next thing to pick up (Janissa's and James's Firestore
documents still don't exist).

### What's done

- **New `faq.html`** — 10-question accordion (native `<details>`/`<summary>`,
  no JS) covering scheduling, pricing, payment, cancellation, format, and
  commitment questions. Added to the nav and footer on every public page
  (not `admin.html`, which keeps its own minimal nav).
- **`resources.html` rewritten** — the seven `[RESOURCE TITLE]` placeholders
  are gone, replaced with six real, verified links: Khan Academy's Math,
  Biology, Chemistry, and Physics courses, plus Paul's Online Math Notes and
  PhET Interactive Simulations. **Important:** Khan Academy reorganized its
  science URLs at some point — the obvious `/science/biology`,
  `/science/chemistry`, and `/science/physics` paths now redirect to pages
  Khan Academy itself labels "archive... not being updated with new
  content." Verified the current replacements in a real browser before
  shipping: `/science/hs-bio`, `/science/hs-chemistry`,
  `/science/highschool-physics`. If these ever get added to or start
  redirecting oddly, check the current URL on khanacademy.org/science before
  reusing the old pattern.
- **`services.html` cancellation policy drafted** — "at least 24 hours'
  notice... life happens, we just ask for enough notice to offer that time
  to another student." Deliberately soft-worded with no monetary penalty
  mentioned, since a late-cancellation fee is a real business-policy call
  that's Joshua's to make, not something to invent silently. Same treatment
  as the original rate-setting: a reasonable default, flagged here for
  Joshua to confirm or adjust, not presented to visitors as a draft.
- **Custom `404.html`** — matches site styling, links to Tutors/Booking/Contact.
  GitHub Pages serves this automatically for any unmatched path at the repo root.
- **SEO basics** — `robots.txt` (disallows `/admin.html`, points to the
  sitemap), `sitemap.xml` (all public pages, not `admin.html`), canonical
  links, Open Graph + Twitter Card meta tags (title/description only, no
  image yet — see README's "Site features checklist" for that gap), and
  `EducationalOrganization` JSON-LD structured data on `index.html` only.
  Deliberately did **not** add a `LocalBusiness` type or any `address`/
  `areaServed` field — the public site has never disclosed a city or service
  area (Irvine, CA was only ever an internal rate-setting reference in this
  file), and publishing a location is a decision for Joshua, not something
  to infer from internal notes.
- **Favicon** — `images/favicon.svg`, a simple navy rounded-square with a
  serif "F", linked from every page including `admin.html`.
- **Contact mailto links** now prefill a subject line per tutor (e.g.
  `?subject=Tutoring%20inquiry%20-%20Physics%20%26%20Science`) so the email
  client opens with context already in the subject field.
- **Considered and deliberately skipped:** initials-based avatars for the
  tutor cards. Don't revisit this without re-deriving initials from real
  names first — Joshua **Y**uan, Janissa **Y**uan, and James **Y**im all
  produce "JY," so any first-letter/last-letter scheme collides for all
  three people and would be actively confusing, not just decorative. A
  subject-color or icon-based differentiator would work but wasn't built —
  no code exists for this yet.
- **`scripts/dev-server.js` + `.claude/launch.json`** added so the Browser
  pane (or any future session) can preview the site over real HTTP.
  Necessary because `js/tutors.js` and `js/admin.js` are `type="module"`
  scripts, and browsers refuse to load ES modules from `file://` — opening
  the HTML files directly fails silently (public pages just show fallback
  content; `admin.html`'s login never becomes interactive). Zero
  dependencies, just Node's built-in `http` module.
- Full manual QA pass via the Browser pane against `scripts/dev-server.js`:
  every page's nav/footer FAQ link, the FAQ accordion's open/close behavior,
  mobile viewport (375px) including the hamburger menu, the custom 404 route,
  and no new console errors anywhere. Confirmed all three new/changed
  external resource links actually resolve to real, current content (not
  just "doesn't 404").

### Where to pick up

Same as "Session 3 handoff" above — nothing here changed the Firebase
picture. Additionally:

1. Confirm the cancellation-policy wording in `services.html` matches what
   Joshua actually wants to enforce (notice period, whether late
   cancellations should ever be charged).
2. Real booking URLs are still the biggest visible gap — `booking.html` and
   each tutor's `admin.html` service entry still point at
   `calendar.app.google/REPLACE-WITH-*`. Each tutor needs to create a Google
   Calendar Appointment Schedule (README has the steps) and enter the real
   link via `admin.html`.
3. Consider a social preview image (`og:image`) once there's a logo or
   branded graphic to use — see README's "Site features checklist."
4. Analytics is provisioned (a GA4 `measurementId` has existed in
   `js/firebase-config.js` since Session 3) but was deliberately left
   unwired this session — enabling it means visitor data starts flowing to
   Google Analytics, which felt like Joshua's call, not a default to enable
   silently.

## Session 5 handoff — resume here

A copy-editing pass, prompted by Joshua flagging the tutors.html headline
("Three tutors, three subjects") as cheesy. Looking closer, the real issue
was one rhetorical trick — "X, not just Y" / "rather than Y" — reused in the
hero headline and all three tutor bios, plus two generic "Ready to ___?"
CTAs and a second rule-of-three headline echoing the flagged one. Rewrote
all of it; no content/features changed, wording only.

- Headlines: home hero h1, home's "What we cover" h2, `tutors.html` h1,
  `services.html` h1.
- CTAs: home and `services.html` closing bands (both were "Ready to ___?").
- All three tutor bios in `tutors.html`, synced to the matching lede text in
  `booking.html`, and the Physics blurb on the homepage subjects grid.
- Deliberately left `Training the mind to think` (the header/footer tagline)
  untouched — it has the same inspirational-poster quality, but it's the
  brand tagline from the original project brief, not incidental page copy.
  Flagged to Joshua; he can revisit it if he wants.

### Important — Joshua's live bio hasn't caught up yet

`tutors.js` renders `t.bio` straight from Firestore once a tutor has a
document, overriding whatever's in the HTML. Joshua's document already
exists (see Session 3), so his bio is **not** controlled by the HTML
anymore — confirmed via the Browser pane against the real
`firm-foundation-tutors` project that his live bio, tutor profile, and
booking panel all still show the old "not just reproduce steps" phrasing.
Janissa and James don't have documents yet, so the HTML fix is what's
actually live for them.

To fix Joshua's live copy, sign in at `/admin.html` and replace the Bio
field with:

> Focuses on building conceptual understanding first, so students can
> explain their reasoning on a problem they haven't seen before.

No MCP/CLI path to Firestore was available this session (`firebase-mcp`
failed to connect — `CONNECT_TIMEOUT` both times it was checked) to do this
automatically; if a future session has working Firestore access and Joshua
asks for it, this is a single-field `updateDoc` on his own document, same
as what `admin.js`'s save button already does.

## Session 6 handoff — resume here

Four features, chosen by Joshua from a ranked list of options after this
session confirmed (via a public, unauthenticated read of the live Firestore
REST API — no credentials needed, `allow read: if true`) that nothing about
the Session 3–5 state had changed: only Joshua has a Firestore document,
his `bio` still has the pre-Session-5 wording, and all `bookingUrl` values
(including his, in Firestore) are still literal `REPLACE-WITH-*` placeholders.

**Not committed or pushed** — Joshua asked for that explicitly this session.

### 1. Fixed the dead booking links

Any `bookingUrl` matching `REPLACE-WITH` (or empty) is now treated as "not
set up yet" rather than rendered as a clickable dead link. Both the
hardcoded `booking.html` panels and `js/tutors.js`'s `buildBookingPanel`
show a "Online booking isn't set up yet for `<name>`" note plus a
"Get in touch to schedule" button (→ `contact.html`) instead. New helper:
`isPlaceholderBookingUrl()` in `tutors.js`. This was a real, live bug —
right now, on the actual deployed site, all three tutors' calendar buttons
go to `calendar.app.google/REPLACE-WITH-*-LINK`, a dead URL.

### 2. Fixed Janissa and James being invisible on every dynamic page

The bigger fix. Previously, `tutors.js` did a full `replaceChildren` wipe on
every dynamic section the moment Firestore returned *any* data — so once
Joshua got a document, his data fully replaced the hardcoded fallback,
silently hiding Janissa and James (who still don't have documents) from the
homepage, the rates table, and the booking tabs, even though their real
hardcoded profiles were sitting right there unused.

Fixed by tagging every hardcoded per-tutor element with `data-tutor="<slug>"`
(added to `index.html`'s subjects-grid cells and tutor-preview cards,
`services.html`'s rate rows, and `booking.html`'s tabs/panels;
`tutors.html`'s profile `<article>`s already had a matching `id` and just
got `data-tutor` added alongside it) and rewriting all five render functions
in `js/tutors.js` around a `partitionExisting()` helper: elements tagged
with a slug **not** present in Firestore are left completely untouched;
elements tagged with a slug that **is** present are discarded and replaced
with freshly built ones. `fetchTutors()` no longer filters by `active`
itself — `init()` now computes `knownSlugs` (every slug Firestore returned a
document for, active or not) and `activeTutors` (the subset to actually
render) separately, so a tutor who's merely *missing* a document keeps
their fallback, while a tutor who's *present but `active: false`* is
correctly removed rather than falling back.

`renderBooking()` needed extra care beyond the other four: tabs/panels carry
interactive state (`aria-selected` / `hidden`) that a naive merge could
leave invalid (e.g. zero selected tabs, if the previously-selected hardcoded
tab was one of the ones discarded). It builds the merged list first, then
normalizes selection in one pass — reuses whichever surviving tab was
already selected, or defaults to the first tab in the merged list. Verified
this actually happens correctly (Janissa's tab, first among the two
survivors) since Joshua's tab was the one discarded and rebuilt.

**Known limitation, accepted as a reasonable tradeoff:** during this
transitional mixed state, tab/card order isn't guaranteed to match the
`order` field — replaced tutors get appended after the surviving hardcoded
ones rather than re-sorted in. Confirmed on the real data (Joshua the only
one in Firestore) that this produces a merely-not-perfectly-ordered but
fully correct and complete result (Janissa, James, Joshua) rather than any
missing or duplicated tutor. Once all three have documents, `orderBy("order")`
in the Firestore query takes over entirely and this stops applying.

### 3. Admin.html field guidance

Non-technical tutors (Janissa and James still haven't signed in even once)
now get told which public pages each field affects, right in the form:
the intro paragraph, the Bio hint, and a new hint under the Rate/Format row
in `js/admin.js`'s `buildServiceBlock()` (that block is fully rebuilt by JS
on every load, so a hint added only to the static `admin.html` shell would
never actually be seen — had to go in `admin.js`). The Booking-link hint
also now explains the new placeholder-link fallback from item 1, so a tutor
who hasn't set one up yet knows visitors will see a friendly message rather
than worrying they've left something broken. The existing "View your
profile" link now deep-links to `tutors.html#<their-slug>` instead of the
top of the page (new `slugFor()` helper in `admin.js`, mirroring the one in
`tutors.js` — not shared, these two files don't share modules currently).

### 4. "Before your first session" section on booking.html

A static three-cell block (confirmation email, video-session setup,
in-person logistics) placed after the tabs, before the existing "Trouble
booking?" note. Every claim in it already existed elsewhere on the site
(services.html's format section, the FAQ) — this doesn't introduce any new
policy, just resurfaces already-established facts at the moment they're
most useful.

### Verification performed

Local dev server (`scripts/dev-server.js`) against the real
`firm-foundation-tutors` Firestore project (the only one that exists —
no way to test against a mock). Confirmed, with no console errors on any
page: homepage shows all three tutors (James/Janissa hardcoded, Joshua
live); `tutors.html` shows all three full profiles; `services.html`'s rates
table shows all five rows (previously only Joshua's two); `booking.html`'s
tabs all switch correctly via click, each panel shows the right tutor's
"booking isn't set up yet" state, and the merged tab list defaults to a
validly-selected tab; mobile width (375px) renders correctly including the
hamburger menu; no broken resource requests (checked the full network log,
all 200s). **Not empirically re-tested:** the total-Firestore-failure and
empty-collection fallback paths — the code for both is byte-for-byte
unchanged in effect from the already-verified Session 3 implementation
(same try/catch, same `if (!list.length) return`), so this was confirmed by
inspection rather than by re-running a live test.

### Where to pick up

Everything in "Session 5 handoff" above is still open (Joshua's live bio
still needs a manual sync via `/admin.html`, real booking URLs are still
needed from each tutor, Janissa and James still need to sign in once).
Nothing done this session changes any of that — it makes the *symptoms* of
those gaps much less visible to real visitors, not the gaps themselves.

## Session 7 handoff — resume here

Audit of the local and live sites (Playwright at 1280/768/375px, read-only
Firestore check, Impeccable detector), then four fixes on top of the still
uncommitted Session 6 work. **Not committed or pushed yet** — waiting on
Joshua's go-ahead. Firestore state unchanged: still only Joshua's document,
old bio, placeholder booking URLs.

Confirmed on the **live** site (which is still the pre-Session-6 commit):
only Joshua appears on the homepage, rates table, and booking tabs, and every
booking button is a dead `REPLACE-WITH` link. Session 6 + 7 fix all of that
once pushed.

1. **Homepage subjects grid** (`renderSubjectsGrid` in `js/tutors.js`) put
   each Firestore tutor's *bio* in the subject blurb, and made one cell per
   service, so Joshua's two subjects left a 4-cell grid with an empty block.
   Now one cell per tutor, and an active tutor's hardcoded cell is kept even
   when they have a Firestore doc (the blurb is site copy with no Firestore
   source). Only a tutor with no hardcoded cell gets a generated one
   (first subject + credential + "Also available for …"). Tested with a
   mocked Firestore module: inactive tutor removed, new tutor generated, bio
   never shown. Tradeoff: if a tutor changes subjects in admin, their
   homepage cell won't follow — edit `index.html` for that.
2. **404 on nested paths** (`/Tutoring/a/b`) loaded unstyled. `404.html` now
   injects a `<base>` (`/Tutoring/` on Pages, `/` locally) before any link,
   and repoints the skip link so `#main` doesn't navigate away.
3. **Booking copy** no longer promises a calendar confirmation that can't
   happen yet (hero lede + "Confirmation" cell in `booking.html`). Other
   pages still say "book on their calendar" (`faq.html`, `services.html`,
   `contact.html`, `404.html`) — they become true once real booking URLs exist.
4. **Accessibility:** new `--blue-ink: #2470BE` token (4.8:1 on paper) for
   links and small blue labels; `--blue-mid` stays for borders/focus/accents.
   Links inside `.page-head` are now white. Added visually-hidden `<h2>`s so
   `services.html`, `contact.html`, `404.html` no longer skip H1→H3.
   Detector now reports 0 contrast/heading findings. Its remaining flags
   (Inter, hero grid, eyebrow label) are brief-mandated and deliberately kept.

`.playwright-mcp/` (Playwright MCP output) added to `.gitignore`.

## Placeholder checklist

- [x] Janissa's credential and bio — filled in from her resume (Session 3), plus
      added Chemistry as a second subject (see "Open questions" above)
- [x] James's bio and credential — filled in from his resume (Session 3): Biological
      Sciences major at UC Davis (pre-dental), recently completed AP Calculus AB & BC,
      volleyball coaching experience informs his tutoring style. Draft wording, not
      reviewed by James himself — sanity check before treating as final.
- [x] All three rates (set to Irvine-average-based $60 / $35 / $35 — sanity check recommended)
- [x] Joshua's math service — added: any HS math level, $60/hr
- [ ] Booking URLs (all three — currently `calendar.app.google/REPLACE-WITH-*`)
- [x] James's contact email — `jamesyim2004@gmail.com` (from his resume)
- [x] Janissa's contact email — `janissa6646@gmail.com` (from her resume, Session 3)
- [x] Joshua's contact email — `joshuaaa100@icloud.com`
- [x] Payment method — Venmo, per-tutor link editable via `admin.html` (Session 3)
- [x] Cancellation policy (`services.html`) — drafted, Session 4 (see handoff above — confirm wording)
- [x] Resource links and titles (`resources.html`) — curated external links, Session 4
- [x] Joshua's LinkedIn link added to his `tutors.html` profile (Session 3)
