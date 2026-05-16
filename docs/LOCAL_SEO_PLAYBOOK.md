# Local SEO & Lead-Generation Playbook
## For Siliguri Security Services Pvt. Ltd.

Last updated: 2026-05-15

This document is the **non-code** companion to the Eleventy site. It captures
the actions that drive traffic and leads but can't be automated in build —
Google Business Profile, directory listings, call tracking, GA4 / Clarity
configuration, and the operational discipline (NAP consistency) that ties
them together.

---

## 1. The single source of truth

Every piece of business information used in marketing must match
`src/_data/site.json` **byte-for-byte**. The canonical values are:

| Field | Value |
|---|---|
| Legal name | Siliguri Security Services Pvt. Ltd. |
| Public name | Siliguri Security Services |
| Phone | +91-70017-61679 |
| Email | siliguri.security.services@gmail.com |
| Address | Near Hospital More, Matigara, Siliguri-734010, West Bengal, India |
| Director | B. K. Barman |
| Founded | 2008 |
| PSARA licence | 10/WB/PSA/2015 |

**NAP consistency rule:** If you update any of these in real life, the
**first** place you update is `src/_data/site.json`, then push every other
listing (GBP, JustDial, IndiaMART, LinkedIn) to match. If they ever drift,
local search rankings drift with them.

---

## 2. Google Business Profile (GBP)

GBP is where 60–80% of local enquiries originate. **Set it up properly once,
maintain it weekly.**

### Primary profile (Matigara HQ)

- **Business name:** Siliguri Security Services Pvt. Ltd.
- **Categories:**
  - Primary: Security guard service
  - Additional: Janitorial service, Facility management company, Housekeeping service
- **Address:** Near Hospital More, Matigara, Siliguri-734010 (verified by postcard)
- **Service area:** Add Siliguri, Matigara, Bagdogra, Salugara, Sukna, Naxalbari
- **Phone:** +91-70017-61679 (must match site)
- **Hours:** Mon–Fri 11 AM – 5 PM, Sat 11 AM – 2 PM, "24/7 operations support" in description
- **Description:** Use the `description` field from `site.json` verbatim
- **Photos:** Upload the photography day output from Phase 2 — at least 10 photos
  (uniformed guards, HQ exterior, control room, vehicles, team). Replace stock
  if used.

### Service-area profiles (no separate addresses!)

Create **one** GBP per city you serve, marked as "service area only" with NO
physical address — Google will suspend profiles with fake offices:

- Darjeeling (cover Kurseong, Ghum, Mirik, Sukhia Pokhri)
- Kalimpong (cover Algarah, Pedong, Lava)
- Gangtok (cover Tadong, Rangpo, Singtam, Pakyong)
- Jalpaiguri (cover Mainaguri, Dhupguri)
- Alipurduar (cover Falakata, Birpara, Jaigaon)
- Dooars: skip (no GBP category for "region" — pages on the site handle this)

For each service-area profile, the description should explicitly say
"Service-area business — operations dispatched from our Siliguri HQ" so
Google understands the model.

### Weekly maintenance (every Monday, 15 minutes)

- Post one update under "Posts" (link to a blog article, a new client win
  with permission, a hiring drive, or a sector-specific tip)
- Respond to all reviews (yes, the bad ones too — politely, with a phone
  number for resolution)
- Add 2–3 photos from the past week's deployments (with permission)
- Answer one Q in the Q&A section (you can seed your own Qs from common
  enquiries)

### Review collection

After every contract signing, send a personal text from the director's
number with a short GBP review link. Aim for 1–2 new reviews per month.
**Never buy reviews.** Google detects pattern manipulation and the entire
profile gets suspended.

---

## 3. Directory listings

| Directory | Priority | Action |
|---|---|---|
| JustDial | High | Premium listing (~₹2k/mo). Single biggest paid lead source in Tier-2 India. |
| IndiaMART | High | Free listing + premium upgrade if budget allows. B2B-focused. |
| Sulekha | Medium | Free listing |
| Yellow Pages India | Low | Free listing |
| Industry Cards | Low | Free listing |
| TradeIndia | Medium | Free listing |
| LinkedIn Page | High | Free, but populate weekly |
| Facebook Business Page | Medium | Already exists at facebook.com/siligurisisecurity — update branding |

Use the canonical NAP from `site.json`. **Audit quarterly.**

---

## 4. Backlinks (low-effort, high-quality)

- **Siliguri Chamber of Commerce** — annual membership, listing in member
  directory, attend events for relationship-based referrals
- **North Bengal MSME directory** — free
- **FICCI / CII** member listings — if eligible
- **PSARA-licensed agency directories** — usually maintained by state Home
  Departments; we're already on the West Bengal list as licence 10/WB/PSA/2015
- **Sponsor a local school sports day or community event** — gets you mentioned
  in local press; trumps any paid SEO link
- **Guest article in a regional business magazine** (Career Edge, Eastern
  Panorama) — once a quarter

**Avoid:** any "buy 100 backlinks for ₹1000" service. They are toxic and
trigger Google penalties.

---

## 5. Call tracking

Recommended: **MyOperator** (India-native, supports IVR + tracking) or
**Knowlarity**. ₹2,000–4,000/month.

Setup:
- Buy 4 tracking numbers — one each for: Organic, Google Ads, JustDial,
  Direct/Walk-in
- Forward all to +91-70017-61679 in priority order
- Use the numbers in the right context: tracking number for that source on
  GBP / JustDial / Google Ads campaigns. Brand number on the website
  header for everyone else.
- This gives you precise "which source generated this call" data without
  the prospect ever seeing a different number on the site they trust.

---

## 6. Analytics setup (one-time, ~1 hour)

1. **Create a GA4 property** at analytics.google.com — set timezone IST,
   currency INR.
2. **Create a GTM container** at tagmanager.google.com — link GA4 to it.
3. **Sign up for Microsoft Clarity** (free) at clarity.microsoft.com.
4. **Add IDs to `src/_data/site.json`:**
   ```json
   "gtmId": "GTM-XXXXXXX",
   "ga4Id": "G-XXXXXXXXXX",
   "clarityId": "xxxxxxxxxx"
   ```
   The `src/_includes/partials/analytics.njk` partial picks them up
   automatically — no other changes needed.
5. **In GA4, mark these events as "conversions":**
   - `lead_submitted` (fires from `assets/js/main.js`)
   - `call_click` (fires when phone link is clicked)
   - `whatsapp_click` (fires when WhatsApp link is clicked)
6. **In GTM, set up a trigger for `lead_submitted` and route it to:**
   - GA4 conversion
   - Google Ads conversion (if running ads)
   - Facebook Conversions API (if running Meta ads)
7. **In Clarity:** filter recordings by `pages/quote/` and
   `locations/siliguri/` to watch how real prospects use the highest-value
   pages. You'll find UX issues you'd never spot otherwise.

---

## 7. Content cadence

The blog already has 6 posts referenced in `sitemap.xml`. Phase 6 of the
upgrade plan builds these out. After that, target:

- **One new post per 10 days** — practical, sector-specific, ranks for
  "how do I … in Siliguri/North Bengal" queries
- **One location-specific photo update per month** — adds freshness to
  location landing pages without rewriting them
- **One case study per quarter** — driven by a real client deployment;
  always with written permission

Topic priorities (highest commercial intent first):
1. "How much does a security guard cost in Siliguri / Darjeeling / Gangtok"
2. "How to choose a security agency for [sector] in North Bengal"
3. "PSARA licence — what to verify before signing a security contract"
4. "Armed vs unarmed guards — when do you really need armed?"
5. "Combined security + housekeeping contract — when does it save money?"
6. Tea-estate / hotel / hospital / bank-branch specific deep dives

---

## 8. Operational discipline that compounds

These habits drive more leads than any SEO tactic:

- **Pick up every call within 3 rings during office hours.** A missed call
  in B2B security usually means the prospect calls the next agency on
  Google.
- **Reply to every WhatsApp inquiry within 30 minutes during business
  hours, 2 hours on Saturdays.** Auto-reply with expected response time
  outside hours.
- **Always email a written proposal within 24 hours of a site visit.** This
  alone separates us from 80% of competitors who promise "I'll send it
  tonight" and never do.
- **Send a personal SMS from the director's number to every prospect after
  the proposal.** Not a marketing message — a human checking if the
  proposal made sense. Wins contracts.
- **Every month, ask one happy client to leave a Google review.** Over a
  year that's 12 reviews — and 12 reviews moves you from "5 reviews,
  4.6 stars" to a credible local-search result.

---

## 9. Quarterly audit checklist

Every quarter (set a calendar reminder for the director or operations lead):

- [ ] GBP NAP matches `site.json` on all profiles
- [ ] JustDial, IndiaMART, Sulekha listings match `site.json`
- [ ] All 6 service-area GBPs have posted in the last 30 days
- [ ] At least 3 new Google reviews in the quarter
- [ ] GA4 shows `lead_submitted` events firing
- [ ] Search Console shows zero "404" or "Indexed though blocked" errors
- [ ] Sitemap.xml in Search Console says "Success" with the current page count
- [ ] PSARA licence not within 60 days of renewal (renew early to avoid
      directory-listing disruption)

---

## 10. What lives in code, what lives here

| Concern | Lives in code | Lives in this playbook |
|---|---|---|
| Phone, email, address | `src/_data/site.json` | NAP consistency rules |
| Page content & SEO | `src/**/*.njk` | Content cadence |
| Lead form | `api/lead.js`, partials | Lead-response SOP |
| Analytics tags | `src/_includes/partials/analytics.njk` | Configuring GA4 / GTM |
| Service area | `src/_data/locations.json` | GBP service-area profiles |
| Pricing | `src/_data/site.json#guardTiers` | Discount discipline |

If you ever find yourself making a marketing claim ("we cover Sikkim",
"₹15,000 per guard") that's not in `site.json` — update `site.json` first,
let the build flow it through every page, then update GBP / JustDial /
LinkedIn. The site is the source of truth; everything else is a reflection.
