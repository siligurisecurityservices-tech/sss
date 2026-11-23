const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

// Exercise the browser submit handler without sending applications or emails.
const source = fs.readFileSync("assets/js/main.js", "utf8").replace(
  "ready(init);",
  "globalThis.submitForTest = handleSubmit;"
);
async function submit(kind, endpoint, networkFailure = false, overrides = {}) {
  const values = { name: "Test Applicant", phone: "9999999999", role: "Security Guard — Barasat / Kolkata branch", location: "Barasat", experience: "None", willingToRelocate: "No — local posting only", ...overrides };
  let payload;
  const button = {};
  const form = {
    querySelector(selector) {
      if (selector === "button[type=submit]") return button;
      if (selector === "[name=phone]") return { value: values.phone };
      if (selector === "[name=name]") return { value: values.name };
      return null;
    },
    checkValidity: () => true,
    getAttribute: key => key === "data-endpoint" ? endpoint : kind,
  };
  const context = {
    document: { title: "Test", readyState: "loading", addEventListener() {} },
    window: { location: { href: "https://example.test/careers/security-guard-jobs-barasat/" } },
    FormData: class { forEach(fn) { Object.entries(values).forEach(([key, value]) => fn(value, key)); } },
    fetch: async (_url, options) => {
      payload = JSON.parse(options.body);
      if (networkFailure) throw new Error("offline");
      return { ok: true, json: async () => ({}) };
    },
    setTimeout: fn => fn(),
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  await context.submitForTest({ preventDefault() {} }, form);
  return { payload, message: new URL(context.window.location.href).searchParams.get("text") };
}
(async () => {
  for (const offline of [false, true]) {
    const career = await submit("career", "/api/lead", offline);
    assert.equal(career.payload.formType, "career");
    assert.equal(career.payload.location, "Barasat");
    assert.match(career.message, /apply for a job/);
    assert.match(career.message, /Role applied for: Security Guard — Barasat/);
    assert.match(career.message, /Location: Barasat/);
    assert.match(career.message, /Willing to relocate: No/);
  }
  for (const applicant of [
    { role: "Security Guard — Matigara / Siliguri head office", location: "Matigara" },
    { role: "Security Guard — Matigara / Siliguri head office", location: "Gossainpur" },
    { role: "Security Guard — Barasat / Kolkata branch", location: "Madhyamgram" },
  ]) {
    for (const offline of [false, true]) {
      const career = await submit("career", "/api/lead", offline, applicant);
      assert.equal(career.payload.formType, "career");
      assert.equal(career.payload.role, applicant.role);
      assert.equal(career.payload.location, applicant.location);
      assert(career.message.includes("Role applied for: " + applicant.role));
      assert(career.message.includes("Location: " + applicant.location));
    }
  }
  assert.equal((await submit(null, "/api/lead")).payload.formType, "quote");
  assert.equal((await submit(null, "/api/site-visit")).payload.formType, "site-visit");
  console.log("PASS: career routing, both local office roles/localities and WhatsApp fallback; quote/site-visit routing preserved.");
})().catch(error => { console.error(error); process.exitCode = 1; });
