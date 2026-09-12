/* ==========================================================================
   Firm Foundation — public tutor data
   Fetches the `tutors` collection from Firestore and re-renders whichever of
   the known DOM hooks are present on the current page. If the fetch fails,
   or Firestore has no active tutors yet, this does nothing — the hardcoded
   markup already in each page is the fallback, and stays exactly as-is.
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function firstName(name) {
  return (name || "").trim().split(/\s+/)[0];
}

function slugFor(name) {
  return firstName(name).toLowerCase();
}

/* Public pages show "First L." rather than a tutor's full last name. The
   full name is still stored in Firestore and shown to the tutor themselves
   in admin.html — this is a display-only privacy choice. */
function displayName(name) {
  const parts = (name || "").trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || "";
  return parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
}

function formatRate(rate) {
  return "$" + rate + "/hr";
}

/* Stored format values ("In person" / "Video" / "Both") stay as the exact
   enum admin.js and firestore.rules validate against — only the public
   display text is friendlier. */
const FORMAT_LABELS = {
  "In person": "In-Person",
  "Video": "Online",
  "Both": "In-Person/Online",
};

function formatLabel(format) {
  return FORMAT_LABELS[format] || format;
}

/* Tutors can set their own LinkedIn URL via admin.html. Only render it as a
   link if it's actually http(s) — a stray "javascript:" value must never
   reach an href, or clicking it would run arbitrary script for any visitor. */
function safeHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? value : null;
  } catch (err) {
    return null;
  }
}

/* Built via createElementNS, not innerHTML — same reasoning as el() below,
   this is a fixed developer-authored icon, but keeping it out of innerHTML
   entirely means there's never a temptation to interpolate anything into it. */
function linkedinIcon() {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 448 512");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute(
    "d",
    "M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"
  );
  svg.appendChild(path);
  return svg;
}

/* Builds a DOM element without ever parsing a string as HTML — tutor bios
   and credentials will eventually come from tutors editing their own
   profile, so they're never trustworthy enough for innerHTML. */
function el(tag, opts, children) {
  const node = document.createElement(tag);
  opts = opts || {};
  if (opts.class) node.className = opts.class;
  if (opts.text != null) node.textContent = opts.text;
  if (opts.attrs) {
    for (const key in opts.attrs) node.setAttribute(key, opts.attrs[key]);
  }
  (children || []).forEach(function (child) {
    if (child) node.appendChild(child);
  });
  return node;
}

async function fetchTutors() {
  const q = query(collection(db, "tutors"), orderBy("order"));
  const snap = await getDocs(q);
  return snap.docs
    .map(function (doc) {
      const data = doc.data();
      return Object.assign({ id: doc.id, slug: slugFor(data.name) }, data);
    })
    .filter(function (t) {
      return t.active !== false;
    });
}

/* ------------------------------------------------------------ renderers -- */

function renderSubjectsGrid(tutors) {
  const root = document.getElementById("subjects-grid");
  if (!root) return;

  const cells = [];
  tutors.forEach(function (t) {
    (t.services || []).forEach(function (s) {
      cells.push(
        el("div", { class: "cell" }, [
          el("p", { class: "eyebrow", text: "With " + displayName(t.name) }),
          el("h3", { text: s.subject }),
          el("p", { text: t.bio || "" }),
        ])
      );
    });
  });
  if (!cells.length) return;
  root.replaceChildren.apply(root, cells);
}

function renderTutorPreview(tutors) {
  const root = document.getElementById("tutor-preview");
  if (!root) return;

  const cards = tutors.map(function (t) {
    const subjects = (t.services || []).map(function (s) { return s.subject; }).join(", ");
    return el("article", { class: "tutor-card" }, [
      el("h3", { text: displayName(t.name) }),
      el("p", { class: "card-subject", text: subjects }),
      el("p", { class: "card-credential", text: t.credential || "" }),
      el("a", { class: "arrow-link", attrs: { href: "tutors.html#" + t.slug } }, [
        document.createTextNode("Read profile →"),
      ]),
    ]);
  });
  if (!cards.length) return;
  root.replaceChildren.apply(root, cards);
}

function renderTutorProfiles(tutors) {
  const root = document.getElementById("tutor-profiles");
  if (!root) return;

  const articles = tutors.map(function (t) {
    const services = t.services || [];
    const subjects = services.map(function (s) { return s.subject; }).join(", ");
    const multi = services.length > 1;

    const asideChildren = [];
    services.forEach(function (s) {
      if (multi) asideChildren.push(el("p", { class: "eyebrow", text: s.subject }));
      asideChildren.push(
        el("dl", { class: "spec-list" }, [
          el("div", {}, [el("dt", { text: "Subject" }), el("dd", { text: s.subject })]),
          el("div", {}, [el("dt", { text: "Rate" }), el("dd", { class: "rate", text: formatRate(s.rate) })]),
          el("div", {}, [el("dt", { text: "Format" }), el("dd", { text: formatLabel(s.format) })]),
        ])
      );
    });
    asideChildren.push(
      el("a", { class: "btn", attrs: { href: "booking.html#" + t.slug } }, [
        document.createTextNode("Book with " + firstName(t.name)),
      ])
    );

    const linkedinUrl = t.linkedin ? safeHttpUrl(t.linkedin) : null;
    const venmoUrl = t.venmo ? safeHttpUrl(t.venmo) : null;
    const profileMainChildren = [
      el("h2", { text: displayName(t.name) }),
      el("p", { class: "profile-subject", text: subjects }),
      el("p", { class: "profile-credential", text: t.credential || "" }),
      el("p", { class: "profile-bio", text: t.bio || "" }),
    ];
    if (linkedinUrl) {
      profileMainChildren.push(
        el("a", { class: "arrow-link icon-link", attrs: { href: linkedinUrl, target: "_blank", rel: "noopener noreferrer" } }, [
          linkedinIcon(),
          document.createTextNode("LinkedIn"),
        ])
      );
    }
    if (venmoUrl) {
      profileMainChildren.push(
        el("a", { class: "arrow-link", attrs: { href: venmoUrl, target: "_blank", rel: "noopener noreferrer" } }, [
          document.createTextNode("Pay via Venmo →"),
        ])
      );
    }

    return el("article", { class: "profile", attrs: { id: t.slug } }, [
      el("div", { class: "profile-main" }, profileMainChildren),
      el("aside", { class: "profile-aside" }, asideChildren),
    ]);
  });
  if (!articles.length) return;
  root.replaceChildren.apply(root, articles);
}

function renderRatesTable(tutors) {
  const root = document.getElementById("rates-body");
  if (!root) return;

  const rows = [];
  tutors.forEach(function (t) {
    (t.services || []).forEach(function (s) {
      rows.push(
        el("tr", {}, [
          el("th", { attrs: { scope: "row" }, text: s.subject }),
          el("td", { text: displayName(t.name) }),
          el("td", { class: "rate", text: formatRate(s.rate) }),
          el("td", { text: formatLabel(s.format) }),
        ])
      );
    });
  });
  if (!rows.length) return;
  root.replaceChildren.apply(root, rows);
}

function renderBooking(tutors) {
  const tabsRoot = document.getElementById("booking-tabs");
  const panelsRoot = document.getElementById("booking-panels");
  if (!tabsRoot || !panelsRoot || !tutors.length) return;

  const tabs = tutors.map(function (t, i) {
    return el("button", {
      class: "tab",
      attrs: {
        type: "button",
        role: "tab",
        id: "tab-" + t.slug,
        "aria-controls": "panel-" + t.slug,
        "aria-selected": i === 0 ? "true" : "false",
        tabindex: i === 0 ? "0" : "-1",
      },
      text: displayName(t.name),
    });
  });

  const panels = tutors.map(function (t, i) {
    const services = t.services || [];
    const subjects = services.map(function (s) { return s.subject; }).join(", ");
    const multi = services.length > 1;

    const specRows = [];
    const bookLinks = [];
    services.forEach(function (s) {
      specRows.push(el("div", {}, [el("dt", { text: "Rate" }), el("dd", { class: "rate", text: formatRate(s.rate) })]));
      specRows.push(el("div", {}, [el("dt", { text: "Format" }), el("dd", { text: formatLabel(s.format) })]));
      bookLinks.push(
        el("a", { class: "btn", attrs: { href: s.bookingUrl || "#", target: "_blank", rel: "noopener noreferrer" } }, [
          document.createTextNode((multi ? s.subject + " — " : "") + "Open " + firstName(t.name) + "'s calendar"),
        ])
      );
    });

    const venmoUrl = t.venmo ? safeHttpUrl(t.venmo) : null;
    const asideChildren = [el("dl", { class: "spec-list" }, specRows)].concat(bookLinks);
    if (venmoUrl) {
      asideChildren.push(
        el("a", { class: "arrow-link", attrs: { href: venmoUrl, target: "_blank", rel: "noopener noreferrer", style: "display:block;margin-top:12px;" } }, [
          document.createTextNode("Pay via Venmo →"),
        ])
      );
    }
    asideChildren.push(el("p", { class: "hint", text: "Opens in a new tab." }));

    const panel = el(
      "div",
      { class: "tabpanel", attrs: { role: "tabpanel", id: "panel-" + t.slug, "aria-labelledby": "tab-" + t.slug, tabindex: "0" } },
      [
        el("div", { class: "booking-panel" }, [
          el("div", {}, [
            el("h2", { text: displayName(t.name) }),
            el("p", { class: "profile-subject", text: subjects }),
            el("p", { class: "lede", text: t.bio || "" }),
          ]),
          el("aside", {}, asideChildren),
        ]),
      ]
    );
    panel.hidden = i !== 0;
    return panel;
  });

  tabsRoot.replaceChildren.apply(tabsRoot, tabs);
  panelsRoot.replaceChildren.apply(panelsRoot, panels);
}

/* ------------------------------------------------------------------ init -- */

(async function init() {
  let tutors;
  try {
    tutors = await fetchTutors();
  } catch (err) {
    console.error("Firm Foundation: could not load tutor data, showing fallback content.", err);
    return;
  }
  if (!tutors.length) return;

  renderSubjectsGrid(tutors);
  renderTutorPreview(tutors);
  renderTutorProfiles(tutors);
  renderRatesTable(tutors);
  renderBooking(tutors);

  if (window.FF && typeof window.FF.initTabs === "function") {
    window.FF.initTabs("#booking-tabs");
  }
})();
