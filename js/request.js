/* ==========================================================================
   Firm Foundation — session request form (booking.html)
   Loads the active tutors from Firestore to fill the Tutor / Subject
   dropdowns, then saves a submitted request to the `requests` collection.
   A Cloud Function (functions/index.js) picks it up and emails/texts the
   tutor. Firestore rules validate every field again on the server side.
   ========================================================================== */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const form = document.getElementById("request-form");
if (form) init();

function init() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const tutorSelect = document.getElementById("r-tutor");
  const subjectSelect = document.getElementById("r-subject");
  const gradeSelect = document.getElementById("r-grade");
  const formatSelect = document.getElementById("r-format");
  const nameInput = document.getElementById("r-name");
  const phoneInput = document.getElementById("r-phone");
  const emailInput = document.getElementById("r-email");
  const messageInput = document.getElementById("r-message");
  const honeypot = document.getElementById("r-website");
  const submitBtn = document.getElementById("r-submit");
  const errorEl = document.getElementById("req-error");
  const successEl = document.getElementById("request-success");
  const successText = document.getElementById("request-success-text");

  let tutors = [];

  function firstName(name) {
    return (name || "").trim().split(/\s+/)[0];
  }

  /* Public pages show "First L." — same display rule as the rest of the site. */
  function displayName(name) {
    const parts = (name || "").trim().split(/\s+/);
    if (parts.length < 2) return parts[0] || "";
    return parts[0] + " " + parts[parts.length - 1].charAt(0) + ".";
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    errorEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function option(value, text) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = text;
    return o;
  }

  function checkedValues(containerId) {
    return Array.from(document.querySelectorAll("#" + containerId + " input:checked")).map(function (i) {
      return i.value;
    });
  }

  /* -------------------------------------------------------- tutor/subject -- */

  function fillSubjects() {
    const tutor = tutors[Number(tutorSelect.value)];
    subjectSelect.replaceChildren();
    if (!tutor) {
      subjectSelect.appendChild(option("", "Choose a tutor first"));
      subjectSelect.disabled = true;
      return;
    }
    const subjects = [];
    (tutor.services || []).forEach(function (s) {
      if (s.subject && subjects.indexOf(s.subject) === -1) subjects.push(s.subject);
    });
    if (subjects.length !== 1) subjectSelect.appendChild(option("", "Choose a subject"));
    subjects.forEach(function (s) { subjectSelect.appendChild(option(s, s)); });
    subjectSelect.disabled = false;
  }

  async function loadTutors() {
    try {
      const snap = await getDocs(query(collection(db, "tutors"), orderBy("order")));
      tutors = snap.docs
        .map(function (d) { return Object.assign({ id: d.id }, d.data()); })
        .filter(function (t) { return t.active !== false && (t.services || []).length; });
    } catch (err) {
      console.error("Firm Foundation: could not load tutors for the request form.", err);
      tutors = [];
    }

    tutorSelect.replaceChildren();
    if (!tutors.length) {
      tutorSelect.appendChild(option("", "Unavailable"));
      showError("The request form isn't available right now. Please email a tutor directly from the Contact page.");
      return;
    }

    tutorSelect.appendChild(option("", "Choose a tutor"));
    tutors.forEach(function (t, i) { tutorSelect.appendChild(option(String(i), displayName(t.name))); });
    tutorSelect.disabled = false;
    submitBtn.disabled = false;

    // Deep links like booking.html#joshua preselect that tutor.
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash) {
      const idx = tutors.findIndex(function (t) { return firstName(t.name).toLowerCase() === hash; });
      if (idx !== -1) {
        tutorSelect.value = String(idx);
        fillSubjects();
      }
    }
  }

  tutorSelect.addEventListener("change", fillSubjects);

  /* ---------------------------------------------------------------- submit -- */

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearError();

    // Bots tend to fill every field. Pretend it worked and drop it.
    if (honeypot.value) {
      form.hidden = true;
      successEl.hidden = false;
      return;
    }

    const tutor = tutors[Number(tutorSelect.value)];
    const subject = subjectSelect.value;
    const grade = gradeSelect.value;
    const parentName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!tutor) return showError("Please choose a tutor.");
    if (!subject) return showError("Please choose a subject.");
    if (!grade) return showError("Please choose your student's grade.");
    if (!parentName) return showError("Please enter your name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showError("Please enter a valid email address.");
    if (phone.replace(/\D/g, "").length < 7) return showError("Please enter a phone number your tutor can reach.");

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      await addDoc(collection(db, "requests"), {
        tutorId: tutor.id,
        tutorName: displayName(tutor.name),
        subject: subject,
        format: formatSelect.value,
        grade: grade,
        parentName: parentName,
        email: email,
        phone: phone,
        days: checkedValues("r-days"),
        times: checkedValues("r-times"),
        message: messageInput.value.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Send request";
      showError("Something went wrong and your request wasn't sent. Please try again, or email your tutor from the Contact page.");
      return;
    }

    successText.textContent = firstName(tutor.name) + " will reach out by email or text to confirm a time.";
    form.hidden = true;
    successEl.hidden = false;
    successEl.focus();
    successEl.scrollIntoView({ block: "start", behavior: "smooth" });
  });

  loadTutors();
}
