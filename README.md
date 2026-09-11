# Firm Foundation

A static tutoring website for math, biology, and physics, built with plain
HTML/CSS/JS and hosted on GitHub Pages. Tutor profiles, rates, and booking
links live in Firebase (Authentication + Firestore) so each tutor can edit
their own information without touching code.

**Live site:** https://jqyuan-git.github.io/Tutoring/

---

## How it works

- The public pages (`index.html`, `tutors.html`, `services.html`,
  `booking.html`) fetch tutor data from a Firestore `tutors` collection at
  load time. If that fetch fails or no tutors exist yet, the pages fall back
  to the hardcoded content already in the HTML — the site never shows a
  blank or broken page.
- `admin.html` lets a signed-in tutor view and edit only their own record.
  Sign-in is Google or email/password; Firestore security rules (not the
  page itself) are what actually enforce that a tutor can only touch their
  own document.
- `contact.html` email addresses are hardcoded, not stored in Firestore —
  intentionally, to keep the data model to public profile info only.

## Firebase setup (already done for this project — for reference or if rebuilding)

1. Create a Firebase project. (This project: `firm-foundation-tutors`.)
2. In the Firebase Console, register a web app and copy its config into
   `js/firebase-config.js` — this file is safe to commit publicly; the
   config values aren't secrets, security comes entirely from
   `firestore.rules`.
3. In **Authentication → Sign-in method**, enable **Google** and
   **Email/Password**.
4. In **Authentication → Settings → Authorized domains**, add the domain the
   site is actually served from (e.g. `jqyuan-git.github.io`) — Google
   sign-in fails silently otherwise, since only `localhost` and the
   project's own `*.firebaseapp.com` domain are authorized by default.
5. In **Firestore Database**, click "Create database" → Standard edition →
   production mode → pick a location close to your users (can't be changed
   later without recreating the database).
6. Deploy the security rules: `firebase deploy --only firestore:rules`
   (requires `firebase login` and `firebase use --add` first).
7. For each tutor: have them sign in once via the live `admin.html` (or
   create an email/password account for them via the Console, if they'd
   rather not use Google) so their Firebase Auth user — and its UID — exists.
   Then create their document in Firestore (see schema below) using that
   exact UID as the document ID.

## Data model

Collection `tutors`, one document per tutor, **document ID = their Firebase
Auth UID**:

```json
{
  "name": "Joshua Yuan",
  "credential": "High school physics teacher",
  "bio": "Focuses on building conceptual understanding first...",
  "linkedin": "https://www.linkedin.com/in/joshua-yuan-716238281",
  "venmo": "https://venmo.com/u/joshua-yuan",
  "order": 1,
  "active": true,
  "services": [
    {
      "type": "tutoring",
      "subject": "Physics & Science",
      "rate": 60,
      "format": "Both",
      "bookingUrl": "https://calendar.app.google/..."
    }
  ]
}
```

- `format` must be exactly one of `"In person"`, `"Video"`, or `"Both"` —
  the public pages display friendlier labels ("In-Person", "Online",
  "In-Person/Online"), but the stored value has to match one of those three
  strings exactly or it fails the security rules' validation.
- `services` is an array so a tutor can list more than one offering (e.g.
  Joshua tutors both Physics and any high school math level, as two
  entries). A planned `"athletics"` service type (basketball/volleyball
  coaching) will render automatically with no code changes needed.
- `linkedin` is optional — a tutor sets it themselves via `admin.html`; if
  present, a "View LinkedIn" button shows on their `tutors.html` profile.
- `venmo` is optional, same pattern — a tutor's own Venmo link, shown as a
  "Pay via Venmo" button on their profile and on their `booking.html` panel.
  Payment is between the tutor and the family; the site never handles money
  directly.
- `active: false` hides a tutor from public pages without deleting them.
- `order` controls display order across all pages.
- Public names are shown as "First L." (e.g. "Joshua Y.") everywhere except
  a tutor's own admin editor, which shows their full name.

## Setting up Google Calendar booking links

Each tutor needs their own **Google Calendar Appointment Schedule** to get a
bookable link for the `bookingUrl` field:

1. Open [Google Calendar](https://calendar.google.com) and click **Create →
   Appointment schedule**.
2. Set a name, duration (typically 60 minutes to match the site's stated
   session length), and available hours.
3. Under **Booking page**, make sure it's set to accept bookings from
   anyone with the link (not restricted to your organization).
4. Save, then copy the **booking page link** it generates.
5. Paste that link into the "Booking link" field for the matching service
   on `admin.html`, or send it to Joshua to enter directly in Firestore.

Booking pages open in a new tab from `booking.html` — they are intentionally
**not** embedded in an iframe, since many Google accounts block their
scheduling pages from being framed.

## Deploying

- **Site:** push to `master`. GitHub Pages rebuilds automatically (usually
  under a minute, occasionally longer if several pushes land close
  together). No build step — it serves the repo's files directly.
- **Firestore rules:** `firebase deploy --only firestore:rules` after
  editing `firestore.rules`. Rule changes are **not** deployed by pushing to
  GitHub — they only take effect once you run this command.

## Updating your info (for tutors)

1. Go to `/admin.html` and sign in (Google or email/password, whichever you
   set up with).
2. Edit your credential, bio, LinkedIn URL, or service details.
3. Click **Save changes** — updates appear on the live site immediately.

If `admin.html` is opened inside an embedded page (e.g. a Canvas course
page), sign-in won't work inline by design — Google blocks reliable OAuth
inside third-party iframes — so it shows an "Open in a new tab" button
instead.

## Remaining placeholders

- [x] Janissa's credential and bio (from her resume; also added Chemistry
      as a second subject alongside Biology)
- [x] All three tutors' contact emails filled in (`contact.html`)
- [ ] Booking URLs for all three tutors (currently placeholder links)
- [x] Payment method — Venmo, per-tutor link editable via `admin.html`
- [ ] Cancellation policy (`services.html`)
- [ ] Resource links and titles (`resources.html`)
- [ ] Janissa's and James's Firestore documents (waiting on each of them to
      sign in once via `admin.html` so their UID exists)

See `HANDOFF.md` for full session-by-session build history and decisions —
delete that file once the site is finished, it's scaffolding, not
documentation.
