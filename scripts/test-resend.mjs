// Quick Resend connectivity test for local development.
// Reads RESEND_API_KEY + LEAD_FROM_EMAIL from the environment (.env.local works).
// Usage:  node scripts/test-resend.mjs  (sends a test email to LEAD_NOTIFY_EMAIL)
// SECURITY: never hardcode the API key here — it is read from the environment only.

const fs = await import("node:fs");
const path = await import("node:path");

for (const file of [".env.local", ".env"]) {
  const p = path.join(process.cwd(), file);
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  }
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("RESEND_API_KEY not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const from = process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev";
const to = process.env.LEAD_NOTIFY_EMAIL || "siliguri.security.services@gmail.com";

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to,
    subject: "[test] Resend connectivity check",
    html: "<p>If you are reading this, the SMTP-to-Resend path works.</p>",
  }),
});

const body = await res.json().catch(() => ({}));
if (res.ok) {
  console.log("OK — email queued:", body.id);
  console.log(`From ${from} → ${to}`);
} else {
  console.error("FAILED:", res.status, body.name || body.message || "unknown error");
  if (body.name === "domain_not_verified") {
    console.error("Your sending domain is not verified in Resend yet.");
  }
  process.exit(1);
}
