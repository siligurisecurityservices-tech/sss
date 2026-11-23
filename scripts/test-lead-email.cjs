const assert = require('node:assert/strict');
// Dummy credentials and intercepted fetch: no network or real messages.
process.env.RESEND_API_KEY = 'test-only';
process.env.LEAD_NOTIFY_EMAIL = 'clients@example.test';
process.env.LEAD_CAREER_NOTIFY_EMAIL = 'hr@example.test';
delete process.env.TURNSTILE_SECRET;
const { handleLead } = require('../api/_lib/lead.js');
let sent = [];
global.fetch = async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  sent.push(JSON.parse(options.body));
  return { ok: true };
};
let sequence = 0;
async function submit(extra, opts = { kind: 'quote', requireLocation: true }) {
  sent = [];
  const req = { method: 'POST', headers: { 'x-forwarded-for': `192.0.2.${++sequence}` }, body: { name: 'Test Sender', phone: '9999999999', email: 'sender@example.test', ...extra } };
  const res = { setHeader() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  await handleLead(req, res, opts);
  return { res, messages: [...sent] };
}
(async () => {
  for (const formType of ['career', 'quote', undefined]) {
    const { res, messages } = await submit({ formType, role: 'Security Guard — Barasat', location: 'Barasat' });
    assert.equal(res.statusCode, 200);
    assert.match(messages[0].subject, /^\[Job Application\]/);
    assert.match(messages[0].html, /Job Application — Candidate Enquiry/);
    assert.match(messages[0].html, /Preferred posting location/);
    assert.match(messages[0].html, /Security Guard — Barasat/);
    assert.deepEqual(messages[0].to, ['hr@example.test']);
    assert.match(messages[1].subject, /received your application/);
    assert.match(decodeURIComponent(res.body.whatsappUrl), /Role applied for/);
  }
  const optionalLocation = await submit({ formType: 'quote', role: 'Guard' });
  assert.equal(optionalLocation.res.statusCode, 200);
  const quote = await submit({ formType: 'quote', serviceType: 'Security guards', location: 'Kolkata', guardCount: '5' });
  assert.equal(quote.res.statusCode, 200);
  assert.match(quote.messages[0].subject, /^\[Client Quote\]/);
  assert.match(quote.messages[0].html, /Client Enquiry — Quote Request/);
  assert.deepEqual(quote.messages[0].to, ['clients@example.test']);
  assert.match(quote.messages[1].subject, /received your enquiry/);
  const wedding = await submit({ formType: 'quote', serviceType: 'Wedding Security — Guards, Darwan and Bouncers', location: 'Kolkata', guardCount: '2', guardTier: 'Wedding bouncers', notes: 'Event dates: 2026-12-05 to 2026-12-08. Duration: 4 days. Venue: Barasat. Daily start and finish times: 5pm to 11pm.' });
  assert.equal(wedding.res.statusCode, 200);
  assert.match(wedding.messages[0].subject, /^\[Client Quote\]/);
  assert.deepEqual(wedding.messages[0].to, ['clients@example.test']);
  for (const value of ['Wedding Security', 'Wedding bouncers', '4 days', 'Barasat', '5pm to 11pm']) {
    assert(wedding.messages[0].html.includes(value));
    assert(decodeURIComponent(wedding.res.body.whatsappUrl).includes(value));
  }
  const visit = await submit({ location: 'Kolkata', preferredDate: '2026-12-01' }, { kind: 'site-visit', requireLocation: true });
  assert.match(visit.messages[0].subject, /^\[Client Site Visit\]/);
  assert.match(visit.messages[0].html, /Client Enquiry — Site Visit Request/);
  const invalidCandidate = await submit({ formType: 'career' });
  assert.equal(invalidCandidate.res.statusCode, 400);
  assert.equal(invalidCandidate.messages.length, 0);
  const invalidClient = await submit({ formType: 'quote', serviceType: 'Guarding' });
  assert.equal(invalidClient.res.statusCode, 400);
  const spam = await submit({ formType: 'career', role: 'Guard', company_website: 'spam' });
  assert.equal(spam.res.statusCode, 400);
  console.log('PASS: current/legacy candidate routing, client quotes, site visits, subjects, headings, recipient inboxes, auto-replies and validation. No real emails sent.');
})().catch(error => { console.error(error); process.exitCode = 1; });
