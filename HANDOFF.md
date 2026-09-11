# HANDOFF — Firm Foundation Tutoring Site

Working notes for continuing this build in a local Claude Code session.
**Delete this file once the site is finished** — it is scaffolding, not documentation.

---

## Current state

**Build step 1 of 5 is complete.** All seven pages are scaffolded with hardcoded
data and full styling. No Firebase yet.

```
Tutoring/
├── index.html          hero + what we cover + tutor previews + CTA
├── tutors.html         full profile per tutor
├── services.html       rates table + format/payment
├── resources.html      static resource list (placeholders)
├── booking.html        tabs per tutor → Google Calendar links
├── contact.html        one mailto card per tutor
├── admin.html          login form + edit form (UI only, no auth wired)
├── css/style.css       complete design system, ~900 lines
├── js/main.js          nav toggle + accessible tabs (FF.initTabs)
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

### Two bugs found and fixed during step 1

- Header "Book a session" button inherited the pale nav-link blue on white —
  effectively unreadable. Now navy on white (~15:1). See the
  `.site-nav a.btn-invert` block in `style.css`.
- Wordmark tagline wrapped to two lines below 480px and bloated the header.
  Hidden on small phones; the footer still carries it.

---

## Settled

- **GitHub username:** `jqyuan-git`
- **Hosting:** GitHub Pages, from a **new public repo named `Tutoring`**
  (Pages requires a public repo on a free account; fine here — static HTML,
  no secrets, and Firebase web config keys are safe to commit).
- **Live URL:** `https://jqyuan-git.github.io/Tutoring/`
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

Not logged in: email + password form with clear error messaging.
Logged in: a form pre-filled with **only that tutor's own record**. Editable —
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

Joshua has the Firebase MCP plugin installed and his Firebase CLI authenticated.
**Do these directly via MCP rather than handing over instructions.
Confirm each step with him before running it.**

1. Create a Firebase project (or ask which existing one to use)
2. Register a web app and pull the config into `js/firebase-config.js`
3. Enable Email/Password authentication
4. Create three Auth users — **ask him for their emails** and set temporary
   passwords he can share
5. Create Firestore in production mode
6. Create the three tutor documents using the real Auth UIDs
7. Write and deploy `firestore.rules`

**Still include the manual setup steps in the README as a fallback.**

---

## Placeholder checklist

- [ ] Janissa's credential
- [ ] Janissa's bio
- [ ] James's bio
- [x] All three rates (set to Irvine-average-based $60 / $35 / $35 — sanity check recommended)
- [x] Joshua's math service — added: any HS math level, $60/hr
- [ ] Booking URLs (all three — currently `calendar.app.google/REPLACE-WITH-*`)
- [ ] Contact emails (all three — currently `REPLACE-*@example.com`)
- [ ] Payment method (`services.html`)
- [ ] Cancellation policy (`services.html`)
- [ ] Resource links and titles (`resources.html`)
