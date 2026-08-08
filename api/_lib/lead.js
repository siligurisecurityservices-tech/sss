// Shared helpers for /api/lead and /api/site-visit
// No external runtime deps — uses native fetch (Node 18+).

const PHONE_RAW = "919547253232";
const PHONE_DISPLAY = "+91-95472-53232";
const PHONE_REGEX = /^\+?[0-9\-\s()]{10,18}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FROM_EMAIL = process.env.LEAD_FROM_EMAIL || "leads@siligurisecurityservices.com";
const FROM_NAME = "Siliguri Security Services Pvt. Ltd.";
const NOTIFY_EMAIL = process.env.LEAD_NOTIFY_EMAIL || "siliguri.security.services@gmail.com";
const CAREER_NOTIFY_EMAIL = process.env.LEAD_CAREER_NOTIFY_EMAIL || NOTIFY_EMAIL;

function badRequest(res, message) {
  res.status(400).json({ ok: false, error: message });
}

// Simple per-IP sliding-window rate limit. Best-effort: state lives in the warm
// serverless instance, so it does not survive cold starts and is not shared across
// regions. Combined with Turnstile + honeypot + payload limit this stops casual
// abuse and protects the Resend quota / HR inbox.
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;            // 5 submissions per IP per minute
const RATE_LIMIT_BUCKET = new Map(); // ip -> [timestamps]

function clientIp(req) {
  // Vercel sets x-forwarded-for / x-real-ip from its trusted edge. Use the first
  // hop in XFF (the original client). Sanitise to digits/dots/colons/letters.
  const xff = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const realIp = req.headers["x-real-ip"] || "";
  const ip = xff || realIp || "unknown";
  return ip.replace(/[^0-9a-fA-F:.]/g, "").slice(0, 64) || "unknown";
}

function checkRateLimit(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const hits = (RATE_LIMIT_BUCKET.get(ip) || []).filter((t) => t > cutoff);
  if (hits.length >= RATE_LIMIT_MAX) {
    const oldest = hits[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfter };
  }
  hits.push(now);
  RATE_LIMIT_BUCKET.set(ip, hits);

  // Opportunistic cleanup: keep the Map from growing unbounded on hot instances.
  if (RATE_LIMIT_BUCKET.size > 5000) {
    for (const [k, ts] of RATE_LIMIT_BUCKET) {
      if (!ts.length || ts[ts.length - 1] < cutoff) RATE_LIMIT_BUCKET.delete(k);
    }
  }
  return { allowed: true };
}

function setCors(res) {
  // SECURITY: never default to "*" — that lets any site POST and email-flood our HR inbox.
  // Production must set ALLOWED_ORIGIN (the canonical site origin). In dev, set ALLOWED_ORIGIN=*
  // explicitly when testing from another origin.
  const origin = process.env.ALLOWED_ORIGIN || "https://www.siligurisecurityservices.com";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return await new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 50_000) reject(new Error("payload too large"));
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, reason: "missing_token" };
  try {
    const params = new URLSearchParams();
    params.set("secret", secret);
    params.set("response", token);
    if (remoteIp) params.set("remoteip", remoteIp);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await r.json();
    return { ok: !!data.success, raw: data };
  } catch (err) {
    return { ok: false, reason: "verify_error", err: String(err) };
  }
}

function buildWhatsAppUrl(payload, kind) {
  let opener;
  let map;
  if (kind === "career") {
    opener = `Hello, I'd like to apply for a job at Siliguri Security Services Pvt. Ltd.`;
    map = [
      ["name", "Name"], ["phone", "Phone"], ["email", "Email"],
      ["role", "Role applied for"], ["location", "Preferred location"],
      ["experience", "Experience"], ["willingToRelocate", "Willing to relocate"],
      ["notes", "Notes"],
    ];
  } else {
    opener = `Hello ${PHONE_DISPLAY}, I'd like to enquire about your services.`;
    map = [
      ["name", "Name"], ["company", "Company"], ["phone", "Phone"], ["email", "Email"],
      ["location", "Location"], ["serviceType", "Service"], ["guardCount", "Guards needed"],
      ["guardTier", "Tier"], ["preferredDate", "Preferred date"], ["preferredTime", "Preferred time"],
      ["notes", "Notes"],
    ];
  }
  const lines = [opener, ""];
  for (const [k, label] of map) {
    if (payload[k]) lines.push(`${label}: ${payload[k]}`);
  }
  return `https://wa.me/${PHONE_RAW}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function buildEmailHtml(payload, kind) {
  const safe = (s) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  const row = (k, v) => v ? `<tr><td style="padding:6px 10px;background:#f5f5f5;font-weight:600;border-right:1px solid #e7eaef">${k}</td><td style="padding:6px 10px">${safe(v)}</td></tr>` : "";
  const titles = {
    "site-visit": "Free Site Visit Request",
    "career": "New Job Application",
  };
  const title = titles[kind] || "New Quote Request";
  const replyNote = kind === "career"
    ? "Reply to this email to follow up with the candidate (their email, if provided)."
    : "Reply to this email to respond to the prospect.";
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a">
    <h2 style="color:#003366">${title}</h2>
    <p>Received via the website on ${safe(payload.submittedAt || new Date().toISOString())}.</p>
    <table style="border-collapse:collapse;border:1px solid #e7eaef">
      ${row("Name", payload.name)}
      ${row("Company", payload.company)}
      ${row("Phone", payload.phone)}
      ${row("Email", payload.email)}
      ${row("Location", payload.location)}
      ${row("Service", payload.serviceType)}
      ${row("Role applied for", payload.role)}
      ${row("Experience", payload.experience)}
      ${row("Willing to relocate", payload.willingToRelocate)}
      ${row("Guards needed", payload.guardCount)}
      ${row("Tier", payload.guardTier)}
      ${row("Preferred date", payload.preferredDate)}
      ${row("Preferred time", payload.preferredTime)}
      ${row("Notes", payload.notes)}
      ${row("Page", payload.pageUrl)}
    </table>
    <p style="margin-top:18px;color:#666;font-size:12px">${replyNote}</p>
  </body></html>`;
}

function buildAutoReply(payload, kind) {
  const safe = (s) => String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
  const isCareer = kind === "career";
  const bodyLine = isCareer
    ? `Thank you for applying to <strong>Siliguri Security Services Pvt. Ltd.</strong>. We've received your application${payload.role ? ` for <strong>${safe(payload.role)}</strong>` : ""} and our HR team will call you within 2 working days to schedule a walk-in interview.`
    : `Thank you for contacting <strong>Siliguri Security Services Pvt. Ltd.</strong>. We've received your enquiry and a supervisor will be in touch ${payload.preferredDate ? "to confirm your preferred date" : "shortly"}.`;
  const remindLine = isCareer
    ? `<p><strong>Remember:</strong> we never charge candidates for jobs. If anyone asks for money on our behalf, please report it to the director on the number below.</p>`
    : "";
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a">
    <p>Hi ${safe(payload.name) || "there"},</p>
    <p>${bodyLine}</p>
    ${remindLine}
    <p>If urgent, please call <a href="tel:+919547253232">+91-95472-53232</a> or message us on <a href="https://wa.me/919547253232">WhatsApp</a>.</p>
    <p style="color:#666">— Siliguri Security Services Pvt. Ltd.<br>Licensed since 2008 · ISO 9001:2015</p>
  </body></html>`;
}

async function sendResend({ to, replyTo, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // SECURITY: do NOT log `to` (PII) or `subject` (contains submitter's name + location).
    console.warn("[lead] RESEND_API_KEY not set — email not sent (config error).");
    return { ok: false, skipped: true };
  }
  const body = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (replyTo) body.reply_to = replyTo;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    // Log only status code + safe Resend error code/message if present. Never log the full
    // response body or the `to`/`from`/`replyTo` fields — those may contain PII or email
    // addresses we don't want in persistent logs.
    let errCode = "";
    let errMsg = "";
    try {
      const errBody = await r.json();
      errCode = errBody && (errBody.name || errBody.code) ? String(errBody.name || errBody.code).slice(0, 80) : "";
      errMsg = errBody && (errBody.message || errBody.error) ? String(errBody.message || errBody.error).slice(0, 200) : "";
    } catch (_) { /* ignore */ }
    console.error("[lead] resend error", { status: r.status, code: errCode, message: errMsg });
    return { ok: false, status: r.status };
  }
  return { ok: true };
}

function validateLead(payload, opts = {}) {
  if (!payload || typeof payload !== "object") return "Invalid request body.";
  if (payload.company_website && String(payload.company_website).trim() !== "") return "Spam detected.";
  if (!payload.name || String(payload.name).trim().length < 2) return "Please enter your name.";
  if (!payload.phone || !PHONE_REGEX.test(String(payload.phone).trim())) return "Please enter a valid phone number.";
  if (payload.email && !EMAIL_REGEX.test(String(payload.email).trim())) return "Please enter a valid email address.";
  if (opts.requireLocation && (!payload.location || String(payload.location).trim().length < 2)) return "Please choose a location.";
  if (opts.requireRole && (!payload.role || String(payload.role).trim().length < 2)) return "Please choose a role.";
  return null;
}

async function handleLead(req, res, opts = {}) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed" }); return; }

  const rl = checkRateLimit(req);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    res.status(429).json({ ok: false, error: "Too many requests. Please wait a moment and try again." });
    return;
  }

  let payload;
  try { payload = await parseBody(req); }
  catch (_) { return badRequest(res, "Could not read request body."); }

  // formType in the payload can override the endpoint default (allows /api/lead to
  // serve both quote and career forms through a single endpoint).
  const kind = payload.formType || opts.kind || "quote";
  const effectiveOpts = { ...opts };
  if (kind === "career") {
    effectiveOpts.requireRole = true;
    effectiveOpts.requireLocation = false; // location is optional for career applicants
  }

  const validationError = validateLead(payload, effectiveOpts);
  if (validationError) return badRequest(res, validationError);

  const turnstile = await verifyTurnstile(payload["cf-turnstile-response"] || payload.turnstileToken, req.headers["x-forwarded-for"] || "");
  if (!turnstile.ok && !turnstile.skipped) {
    // SECURITY: log only the high-level reason. Do not log the full turnstile response which
    // may include client IP, Cloudflare metadata, or error-code arrays.
    console.warn("[lead] turnstile failed", { reason: turnstile.reason || "verify_failed" });
    return badRequest(res, "Could not verify you're human. Please refresh and try again.");
  }

  const subjectPrefix = {
    "career": "[Career]",
    "site-visit": "[Site Visit]",
    "quote": "[Quote]",
  }[kind] || "[Lead]";
  const subject = `${subjectPrefix} ${payload.name || "Unknown"}${payload.role ? " — " + payload.role : ""}${payload.location ? " — " + payload.location : ""}`;
  const notifyTo = kind === "career" ? CAREER_NOTIFY_EMAIL : NOTIFY_EMAIL;

  const html = buildEmailHtml(payload, kind);
  const notify = await sendResend({
    to: notifyTo,
    replyTo: payload.email || undefined,
    subject,
    html,
  });

  if (payload.email && EMAIL_REGEX.test(payload.email)) {
    const autoSubject = kind === "career"
      ? "We received your application — Siliguri Security Services Pvt. Ltd."
      : "We received your enquiry — Siliguri Security Services Pvt. Ltd.";
    await sendResend({
      to: payload.email,
      subject: autoSubject,
      html: buildAutoReply(payload, kind),
    }).catch(() => {});
  }

  res.status(200).json({
    ok: true,
    emailed: !!notify.ok,
    whatsappUrl: buildWhatsAppUrl(payload, kind),
  });
}

module.exports = { handleLead };
