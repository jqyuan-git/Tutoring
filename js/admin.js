/* ==========================================================================
   Firm Foundation — tutor admin page
   Google or email/password sign-in, then load and save only the signed-in
   tutor's own Firestore document. Firestore rules are the real security
   boundary (a tutor can only update the doc whose ID equals their own uid) —
   this file just gives them a usable form for it.
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const loginView = document.getElementById("view-login");
const editorView = document.getElementById("view-editor");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const googleBtn = document.getElementById("google-signin-btn");
const logoutBtn = document.getElementById("logout-btn");
const currentUserEl = document.getElementById("current-user");
const editorForm = document.getElementById("editor-form");
const servicesList = document.getElementById("services-list");
const addServiceBtn = document.getElementById("add-service");
const saveOk = document.getElementById("save-ok");
const saveError = document.getElementById("save-error");
const nameField = document.getElementById("f-name");
const credentialField = document.getElementById("f-credential");
const bioField = document.getElementById("f-bio");
const linkedinField = document.getElementById("f-linkedin");
const venmoField = document.getElementById("f-venmo");

/* Google (and most identity providers) refuse to sign in reliably inside a
   third-party iframe — e.g. this page embedded in a Canvas course page — as
   an anti-clickjacking measure. Rather than chase an unreliable inline
   sign-in, detect that case and send the tutor to a real tab instead. */
const isFramed = window.self !== window.top;

function showFramedNotice() {
  loginView.hidden = false;
  editorView.hidden = true;

  const panel = loginView.querySelector(".panel");
  panel.replaceChildren();

  const heading = document.createElement("h2");
  heading.style.fontSize = "1.3rem";
  heading.style.marginBottom = "1rem";
  heading.textContent = "Log in";
  panel.appendChild(heading);

  const message = document.createElement("p");
  message.style.marginBottom = "20px";
  message.textContent = "For security, signing in isn't supported inside an embedded page. Open this page in its own tab to log in.";
  panel.appendChild(message);

  const openLink = document.createElement("a");
  openLink.className = "btn";
  openLink.style.width = "100%";
  openLink.href = window.location.href;
  openLink.target = "_blank";
  openLink.rel = "noopener";
  openLink.textContent = "Open in a new tab";
  panel.appendChild(openLink);
}

let currentUid = null;
let serviceCounter = 0;

/* ------------------------------------------------------------- status -- */

function showLoginError(message) {
  loginError.textContent = message;
  loginError.hidden = false;
}

function clearLoginError() {
  loginError.hidden = true;
  loginError.textContent = "";
}

function showSaveStatus(ok, message) {
  saveOk.hidden = !ok;
  saveError.hidden = ok;
  (ok ? saveOk : saveError).textContent = message;
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (err) {
    return false;
  }
}

/* ---------------------------------------------------------- services UI -- */

function field(labelText, input, hint) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const label = document.createElement("label");
  label.setAttribute("for", input.id);
  label.textContent = labelText;
  wrap.appendChild(label);
  wrap.appendChild(input);
  if (hint) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = hint;
    wrap.appendChild(p);
  }
  return wrap;
}

function buildServiceBlock(service) {
  service = service || { type: "tutoring", subject: "", rate: "", format: "Both", bookingUrl: "" };
  const n = ++serviceCounter;

  const fieldset = document.createElement("fieldset");
  fieldset.className = "service-block";
  fieldset.style.border = "1px solid var(--rule)";
  fieldset.dataset.type = service.type || "tutoring";

  const head = document.createElement("div");
  head.className = "service-block-head";
  const h4 = document.createElement("h4");
  head.appendChild(h4);
  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-quiet";
  removeBtn.type = "button";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", function () {
    fieldset.remove();
    renumberServiceBlocks();
  });
  head.appendChild(removeBtn);
  fieldset.appendChild(head);

  const subjectInput = document.createElement("input");
  subjectInput.type = "text";
  subjectInput.id = "service-" + n + "-subject";
  subjectInput.className = "js-subject";
  subjectInput.value = service.subject || "";
  fieldset.appendChild(field("Subject", subjectInput));

  const row = document.createElement("div");
  row.className = "field-row";

  const rateInput = document.createElement("input");
  rateInput.type = "number";
  rateInput.min = "0";
  rateInput.step = "1";
  rateInput.inputMode = "numeric";
  rateInput.id = "service-" + n + "-rate";
  rateInput.className = "js-rate";
  rateInput.value = service.rate != null ? service.rate : "";
  row.appendChild(field("Rate per hour (US$)", rateInput));

  const formatSelect = document.createElement("select");
  formatSelect.id = "service-" + n + "-format";
  formatSelect.className = "js-format";
  ["In person", "Video", "Both"].forEach(function (opt) {
    const o = document.createElement("option");
    o.textContent = opt;
    if (opt === service.format) o.selected = true;
    formatSelect.appendChild(o);
  });
  row.appendChild(field("Format", formatSelect));
  fieldset.appendChild(row);

  const urlInput = document.createElement("input");
  urlInput.type = "url";
  urlInput.id = "service-" + n + "-url";
  urlInput.className = "js-url";
  urlInput.value = service.bookingUrl || "";
  const urlField = field("Booking link", urlInput, "Your Google Calendar appointment page. Paste the whole link.");
  urlField.style.marginBottom = "0";
  fieldset.appendChild(urlField);

  return fieldset;
}

function renumberServiceBlocks() {
  servicesList.querySelectorAll(".service-block").forEach(function (block, i) {
    block.querySelector("h4").textContent = "Service " + (i + 1);
  });
}

function renderServices(services) {
  servicesList.replaceChildren();
  serviceCounter = 0;
  (services && services.length ? services : [null]).forEach(function (s) {
    servicesList.appendChild(buildServiceBlock(s));
  });
  renumberServiceBlocks();
}

function collectServices() {
  return Array.from(servicesList.querySelectorAll(".service-block")).map(function (block) {
    return {
      type: block.dataset.type || "tutoring",
      subject: block.querySelector(".js-subject").value.trim(),
      rate: Number(block.querySelector(".js-rate").value),
      format: block.querySelector(".js-format").value,
      bookingUrl: block.querySelector(".js-url").value.trim(),
    };
  });
}

addServiceBtn.addEventListener("click", function () {
  servicesList.appendChild(buildServiceBlock(null));
  renumberServiceBlocks();
});

/* --------------------------------------------------------------- views -- */

function showLogin() {
  editorView.hidden = true;
  loginView.hidden = false;
  currentUid = null;
}

async function showEditor(user) {
  loginView.hidden = true;
  editorView.hidden = false;
  currentUserEl.textContent = user.email || user.displayName || "signed in";
  currentUid = user.uid;
  saveOk.hidden = true;
  saveError.hidden = true;

  let data;
  try {
    const snap = await getDoc(doc(db, "tutors", user.uid));
    data = snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error(err);
    editorForm.hidden = true;
    showSaveStatus(false, "Couldn't load your profile. Try refreshing the page.");
    return;
  }

  if (!data) {
    editorForm.hidden = true;
    showSaveStatus(false, "No profile is linked to this account yet. Ask Joshua to set one up for you.");
    return;
  }

  editorForm.hidden = false;
  nameField.value = data.name || "";
  credentialField.value = data.credential || "";
  bioField.value = data.bio || "";
  linkedinField.value = data.linkedin || "";
  venmoField.value = data.venmo || "";
  renderServices(data.services);
}

if (isFramed) {
  showFramedNotice();
} else {
  onAuthStateChanged(auth, function (user) {
    if (user) showEditor(user);
    else showLogin();
  });
}

/* ---------------------------------------------------------------- auth -- */

googleBtn.addEventListener("click", async function () {
  clearLoginError();
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error(err);
    showLoginError("Google sign-in didn't go through. Please try again.");
  }
});

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  clearLoginError();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    showLoginError("That email and password combination didn't work.");
  }
});

logoutBtn.addEventListener("click", function () {
  signOut(auth);
});

/* ---------------------------------------------------------------- save -- */

editorForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!currentUid) return;
  saveOk.hidden = true;
  saveError.hidden = true;

  const services = collectServices();
  const invalid = services.some(function (s) {
    return !s.subject || !s.bookingUrl || !Number.isFinite(s.rate) || s.rate < 0;
  });
  if (invalid) {
    showSaveStatus(false, "Please fill in every field for each service with a valid rate.");
    return;
  }

  const linkedin = linkedinField.value.trim();
  if (linkedin && !isHttpUrl(linkedin)) {
    showSaveStatus(false, "That LinkedIn URL doesn't look valid. Leave it blank if you don't want a button.");
    return;
  }

  const venmo = venmoField.value.trim();
  if (venmo && !isHttpUrl(venmo)) {
    showSaveStatus(false, "That Venmo link doesn't look valid. Leave it blank if you don't want a payment link.");
    return;
  }

  try {
    await updateDoc(doc(db, "tutors", currentUid), {
      credential: credentialField.value.trim(),
      bio: bioField.value.trim(),
      linkedin: linkedin,
      venmo: venmo,
      services: services,
    });
    showSaveStatus(true, "Saved.");
  } catch (err) {
    console.error(err);
    showSaveStatus(false, "Couldn't save your changes. Please try again.");
  }
});
