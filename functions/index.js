/* ==========================================================================
   Firm Foundation — request alerts
   Runs whenever a document is created in the `requests` collection. Looks up
   the tutor's private alert settings (tutorPrivate/{uid}) and sends:
     - an email via Gmail (a Google "app password", no domain needed)
     - a text message via Twilio (skipped if Twilio isn't configured)
   Secrets are set with `firebase functions:secrets:set`, never committed.
   ========================================================================== */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

initializeApp();

const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
// Set these three to the word "none" to run with email only.
const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

const SITE_URL = "https://jqyuan-git.github.io/Tutoring/admin.html";

/* Request fields come from the public, so treat every one as untrusted:
   plain-text messages only (no HTML), and no line breaks in anything that
   ends up in a header or an SMS. */
function oneLine(value, max) {
  return String(value == null ? "" : value).replace(/[\r\n\t]+/g, " ").trim().slice(0, max || 200);
}

function toE164(raw) {
  const value = String(raw || "").trim();
  const digits = value.replace(/\D/g, "");
  if (value.startsWith("+") && digits.length >= 8 && digits.length <= 15) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return null;
}

function emailBody(r) {
  const works = (r.days && r.days.length ? r.days.join(", ") : "any day") +
    (r.times && r.times.length ? " (" + r.times.join(", ").toLowerCase() + ")" : "");
  return [
    "New tutoring request",
    "",
    "Parent:   " + oneLine(r.parentName, 100),
    "Email:    " + oneLine(r.email),
    "Phone:    " + oneLine(r.phone, 30),
    "",
    "Subject:  " + oneLine(r.subject, 100),
    "Grade:    " + oneLine(r.grade, 40),
    "Format:   " + oneLine(r.format, 20),
    "Works:    " + works,
    "",
    "Message:",
    String(r.message || "(none)").slice(0, 2000),
    "",
    "Reply to this email to answer the parent directly.",
    "All requests: " + SITE_URL,
  ].join("\n");
}

async function sendEmail(to, r) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER.value(), pass: GMAIL_APP_PASSWORD.value() },
  });
  await transporter.sendMail({
    from: '"Firm Foundation" <' + GMAIL_USER.value() + ">",
    to: to,
    replyTo: oneLine(r.email),
    subject: "New tutoring request: " + oneLine(r.subject, 60) + ", " + oneLine(r.grade, 20),
    text: emailBody(r),
  });
}

async function sendText(to, r) {
  const sid = TWILIO_ACCOUNT_SID.value();
  if (!sid || sid === "none") return false;

  const body = "Firm Foundation: new request from " + oneLine(r.parentName, 40) + " for " +
    oneLine(r.subject, 40) + " (" + oneLine(r.grade, 20) + "). Call/text " +
    oneLine(r.phone, 30) + ". Details emailed.";

  const res = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(sid + ":" + TWILIO_AUTH_TOKEN.value()).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER.value(), Body: body }).toString(),
  });
  if (!res.ok) throw new Error("Twilio responded " + res.status + ": " + (await res.text()));
  return true;
}

exports.notifyTutorOfRequest = onDocumentCreated(
  {
    document: "requests/{requestId}",
    region: "us-central1",
    secrets: [GMAIL_USER, GMAIL_APP_PASSWORD, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const r = snap.data();
    const db = getFirestore();

    const privSnap = await db.doc("tutorPrivate/" + r.tutorId).get();
    const priv = privSnap.exists ? privSnap.data() : {};
    const notifyEmail = oneLine(priv.notifyEmail);
    const notifyPhone = toE164(priv.notifyPhone);

    if (!notifyEmail && !notifyPhone) {
      logger.warn("Request " + snap.id + ": tutor " + r.tutorId + " has no alert email or phone set.");
      return;
    }

    // Email and text are independent: one failing must not block the other.
    const results = {};
    if (notifyEmail) {
      try { await sendEmail(notifyEmail, r); results.email = true; }
      catch (err) { logger.error("Email failed for request " + snap.id, err); results.email = false; }
    }
    if (notifyPhone) {
      try { results.sms = await sendText(notifyPhone, r); }
      catch (err) { logger.error("Text failed for request " + snap.id, err); results.sms = false; }
    }

    await snap.ref.update({ notified: results });
  }
);
