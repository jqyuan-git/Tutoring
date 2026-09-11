# HANDOFF — Firm Foundation Tutoring Site

Working notes for continuing this build in a local Claude Code session.
**Delete this file once the site is finished** — it is scaffolding, not documentation.

---

## Current state (updated in Session 3 — see "Session 3 handoff" below)

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
├── services.html       rates table + format/payment
├── resources.html      static resource list (placeholders)
├── booking.html        tabs per tutor → Google Calendar links
├── contact.html        one mailto card per tutor (static, not Firestore)
├── admin.html          login form (Google + email/password) + edit form
├── css/style.css       complete design system, ~900 lines
├── js/main.js          nav toggle + accessible tabs (FF.initTabs)
├── js/firebase-config.js   web config for project firm-foundation-tutors
├── js/tutors.js         fetches `tutors` collection, renders public pages
├── js/admin.js          Google/email login, load + save own tutor doc
├── firestore.rules      public read, self-only update, no create/delete
├── firebase.json / .firebaserc / firestore.indexes.json
├── images/             empty — no photos supplied
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
2. **Janissa Yuan** — Biology. Credential: `[PLACEHOLDER]`. Bio: `[PLACEHOLDER]`
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

## Placeholder checklist

- [ ] Janissa's credential
- [ ] Janissa's bio
- [x] James's bio and credential — filled in from his resume (Session 3): Biological
      Sciences major at UC Davis (pre-dental), recently completed AP Calculus AB & BC,
      volleyball coaching experience informs his tutoring style. Draft wording, not
      reviewed by James himself — sanity check before treating as final.
- [x] All three rates (set to Irvine-average-based $60 / $35 / $35 — sanity check recommended)
- [x] Joshua's math service — added: any HS math level, $60/hr
- [ ] Booking URLs (all three — currently `calendar.app.google/REPLACE-WITH-*`)
- [x] James's contact email — `jamesyim2004@gmail.com` (from his resume)
- [ ] Contact emails — Joshua's and Janissa's still `REPLACE-*@example.com`
- [x] Payment method — Venmo, per-tutor link editable via `admin.html` (Session 3)
- [ ] Cancellation policy (`services.html`)
- [ ] Resource links and titles (`resources.html`)
- [x] Joshua's LinkedIn link added to his `tutors.html` profile (Session 3)
