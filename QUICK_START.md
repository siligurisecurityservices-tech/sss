# QUICK START GUIDE - Website Management & Updates

## For Team Members Managing the Website

---

## 📋 This Document Contains

1. How to make simple content updates
2. How to respond to form submissions
3. How to add blog articles
4. How to update company information
5. Troubleshooting common issues
6. Who to contact for help

---

## 🚀 Most Important: The Converting Page

**THE QUOTE FORM** (`/pages/quote.html`) is where corporate customers request assessments.

**Your Job:** Get them here and respond quickly!

- Every page links to this form
- Customers fill out: company name, location, guards needed, budget, etc.
- Form opens WhatsApp with their message
- **YOU must respond within 24 hours via WhatsApp**

---

## 🔧 Making Simple Content Updates

### Updating Company Phone/Email

These appear on EVERY page. Update in all files:

**Files to update:**
1. `index.html` - Search for "+91-8376-061234"
2. `pages/about.html`
3. `pages/services.html`
4. `pages/quote.html`
5. `pages/locations.html`
6. `pages/sectors.html`
7. `pages/compliance.html`
8. `pages/facilities.html`
9. `pages/contact.html`
10. `pages/careers.html`

**What to change:**
```
OLD: +91-8376-061234
NEW: +91-YOUR-NEW-NUMBER

OLD: info@siligurisisecurity.com
NEW: your-new-email@company.com
```

### Updating Office Address

Current: "Siliguri, West Bengal"

**Files to update:** Every page in header/footer

Search for "Siliguri" and update with new address.

### Updating Service Pricing

Current pricing on `index.html` (guard comparison table):
- Standard: ₹10-12K/month
- Premium: ₹15-18K/month
- Armed: ₹25-35K/month
- Female: ₹12-15K/month
- Black Commando: ₹40-60K/month

**To update:**
1. Open `index.html`
2. Find "<!-- Guard Categories Table -->" section
3. Update prices in table cells
4. Save file

### Updating Company Information

**Current Data:**
- Company: Siliguri Security Services Pvt. Ltd.
- Founded: 2008 (15+ years)
- Personnel: 450+
- Locations: 50+
- Compliance: 100%

**If any data changes:** Update all pages where mentioned (check with Find).

---

## 📧 Responding to Form Submissions

### When You Get a Quote Request

#### Signal: WhatsApp Message
Website visitor fills quote form → WhatsApp message appears on your phone

#### Message Format
```
Hi, I'm requesting a security assessment for:
Company: [Their Company]
Contact: [Their Name] - [Their Phone]
Site: [Type], Location: [Location]
Guards Needed: [Number]
Service: [Type] | Duration: [Duration]
Requirements: [Special Notes]
```

#### Your Response Steps
1. **Within 1 hour** - Reply with: "Thank you for contacting Siliguri Security Services Pvt. Ltd. Acknowledged your request. Our team will call you shortly with a detailed proposal."
2. **Within 24 hours** - Call them with:
   - Service options & pricing
   - Deployment timeline
   - Compliance certifications
   - Reference customers in their industry
3. **Send proposal** - Email detailed quote with:
   - Guard count & cost breakdown
   - Service start date
   - Monthly/annual pricing
   - Payment terms

### Contact Form Submissions
Visitors submit `/pages/contact.html` form

**Action:** Email to info@siligurisisecurity.com AND respond via WhatsApp within 4 hours

---

## 📝 Adding a Blog Article

### Step 1: Create New Article File

**Location:** `/pages/blog/your-article-name.html`

**Template:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Brief 155-character description here">
    <meta name="keywords" content="keyword1, keyword2, keyword3">
    
    <title>Article Title | Siliguri Security Services Pvt. Ltd.</title>
    <link rel="stylesheet" href="../../assets/css/style.css">
</head>
<body>

<!-- Header (Copy from any other page) -->
<!-- Hero Section -->
<!-- Breadcrumb -->
<!-- Article Content -->
<!-- CTA Section -->
<!-- Footer -->

<script src="../../assets/js/main.js"></script>
</body>
</html>
```

### Step 2: Add Article to Blog List

**File:** `/pages/blog-list.html`

**Add this card:**
```html
<div class="card">
    <em style="color: var(--primary-light); font-size: 0.85rem;">Category Badge</em>
    <h3 style="margin-top: 10px;">Your Article Title</h3>
    <p style="color: #666; font-size: 0.9rem;">📅 Published Dec 2024</p>
    <p>Brief 150-word description of your article. Include main takeaways and why readers should care...</p>
    <a href="blog/your-article-name.html" style="color: var(--primary-light); font-weight: bold;">Read Article →</a>
</div>
```

### Step 3: Update Sitemap

**File:** `/sitemap.xml`

Add entry:
```xml
<url>
    <loc>https://www.siligurisisecurity.com/pages/blog/your-article-name.html</loc>
    <lastmod>2024-12-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
</url>
```

---

## 📍 Adding a Location Page

### Similar to Blog Articles

**File:** `/pages/locations/city-name.html`

**Content Sections:**
- Local hero section (introduce your [City] office)
- Local services available
- Local team/supervisors
- Local case studies
- Directions & contact (local phone/address)
- Quote CTA

**Add to sitemap.xml** when done

---

## 🐛 Quick Troubleshooting

### Issue: Website Shows "Not Found" Error
**Solution:**
1. Check domain registration is active (renew if expired)
2. Check HTTPS is enabled
3. Check file upload - all files in correct folders
4. Clear browser cache (Ctrl+Shift+Del)

### Issue: Forms Don't Send
**Solution:**
1. Check phone number format (+91...)
2. Check WhatsApp Web is accessible
3. Try different browser
4. Contact: Your web hosting provider

### Issue: Images Not Showing
**Solution:**
1. Upload images to `/assets/images/`
2. In HTML, use: `<img src="../../assets/images/photo.jpg">`
3. Check file name matches exactly (case-sensitive)

### Issue: Mobile Menu Broken
**Solution:**
1. Check `/assets/js/main.js` is at correct location
2. Open browser Console (F12) - look for red errors
3. If error, contact: web developer

### Issue: Slow Loading
**Solution:**
1. Compress images before uploading (use TinyPNG.com)
2. Reduce image size (should be < 200KB each)
3. Clear browser cache
4. Contact hosting: Ask for caching enabled

---

## 📊 Analytics & Performance

### Checking Website Traffic

**Google Analytics:** analytics.google.com
- Sign in with company account
- View traffic, bounce rate, top pages
- Look for unusual traffic drops/spikes

### Checking Search Rankings

**Google Search Console:** search.google.com/search-console
- Sign in with company account
- See what keywords bring traffic
- See which pages get impressions
- Look for index errors

### Monitoring Quote Form Conversions

**In Analytics:**
1. Click Goals (in left menu)
2. Look for "Quote Form Submission" goal
3. Check completion rate
4. See which pages convert best

---

## 🎯 Important Metrics to Monitor

| Metric | Goal | Check Weekly |
|--------|------|---|
| Website Visitors | 500+/month | Analytics |
| Quote Form Submissions | 10-20/month | WhatsApp |
| Contact Form Submissions | 5+/month | Email |
| Average Page Time | >2 min | Analytics |
| Conversion Rate | 2-5% | Goals |

---

## 🚨 Emergency Contacts

**If Website is Down:**
1. Check: Is hosting company's server down? (check their status page)
2. If your issue: Contact hosting provider support
3. Check: Did you accidentally delete files?
4. Restore from backup or re-upload files

**If You Can't Access Admin:**
1. Lost password? Reset via hosting control panel
2. Locked out? Contact hosting provider
3. FTP not working? Check credentials, try web file manager

**For Technical Help:**
- Web Developer: _______________
- Hosting Support: _______________
- Domain Support: _______________

---

## 📱 Mobile Phone Integration

### WhatsApp Message Response

**Quick Responses Template:**
```
Thank you for contacting Siliguri Security Services Pvt. Ltd. 
We've received your request for [Site Type] security in [Location].

Our team will call you within 1 hour at [Their Number] with a detailed proposal.

Meantime, here are some quick options:
• Standard Guards: ₹10-12K/month
• Premium Guards: ₹15-18K/month
• Armed Security: ₹25-35K/month
• Multi-location discount: 10-15%

Questions? Call: +91-8376-061234
```

### Phone Call Script

**Opening:**
"Hi [Name], thanks for contacting Siliguri Security. I'm calling about your quote request for [Company] in [Location]. Do you have 5 minutes?"

**Key Information to Gather:**
- How many guards needed?
- What's your budget range?
- When do you need to start?
- Any special requirements?

**Closing:**
"I'll email you a detailed proposal within 2 hours. We offer 100% statutory compliance, verified personnel, and multi-location coordination. Can I confirm your email address?"

---

## 📋 Website Content Calendar

### Monthly Publishing
- **Week 1:** Blog article (1)
- **Week 2:** Update pricing/offers (if needed)
- **Week 3:** Testimonial/Case Study
- **Week 4:** Industry-specific tip post

### Seasonal Updates
- **Jan:** New Year service packages
- **Apr:** Summer security packages
- **Jul:** Monsoon special services
- **Oct:** Year-end compliance updates

### Quarterly Tasks
- Update portfolio/case studies
- Refresh testimonials
- Review & refresh old blog articles
- Update service offerings

---

## ✅ Daily Checklist for Team Lead

**Every Morning:**
- [ ] Check WhatsApp for form submissions
- [ ] Respond to new quote requests
- [ ] Check email for contact form submissions
- [ ] Check Google Analytics for unusual activity

**Every Week:**
- [ ] Review new visitors from Google
- [ ] Check top-performing pages
- [ ] Update company statistics if needed (growth in guards, locations, etc.)
- [ ] Publish blog article or update content

**Every Month:**
- [ ] Full analytics review
- [ ] Search ranking review
- [ ] Form conversion analysis
- [ ] Plan monthly content

---

## 🔐 Access & Credentials

| Item | Username | Password | Notes |
|------|----------|----------|-------|
| Hosting FTP | _____________ | _____________ | Update files here |
| Google Analytics | _____________ | _____________ | View traffic stats |
| Google Search Console | _____________ | _____________ | View search data |
| Domain Registrar | _____________ | _____________ | Renew annually |
| WhatsApp Business | _____________ | _____________ | Lead responses |
| Email Account | _____________ | _____________ | info@... |

**⚠️ IMPORTANT:** Store passwords in secure location (LastPass, 1Password, etc.)

---

## 📞 Who To Contact For What

| Question | Contact | Time |
|----------|---------|------|
| Form not working | Web Developer | 24 hours |
| Website slow | Hosting Provider | 4 hours |
| Domain renewal | Domain Registrar | Immediately when expired |
| New page creation | Web Developer | 2-3 days |
| Content updating | This guide / Web Developer | 1 day |
| Analytics questions | Analytics Expert | 1 week |
| SEO optimization | SEO Specialist | 1 week |

---

## 🎓 Training Resources

**For Content Updates:** This guide (read it again!)
**For HTML Editing:** Look at existing similar pages, copy structure
**For Images:** Use TinyPNG.com to compress before uploading
**For Colors:** Use existing navy (#003366) and light (#f5f5f5)
**For Forms:** Never edit form fields - contact developer

---

## 🎉 Success Metrics - Track These!

**Monthly Targets:**
- Leads from quote form: _______ (Target: 10+)
- Phone calls from website: _______ (Target: 5+)
- Website visitors: _______ (Target: 500+)
- Quote form conversion rate: _______ (Target: 2-5%)

**Growth Targets (6 months):**
- Organic traffic: +50%
- Quote submissions: +100%
- Contract value: +200%

---

## 🔄 Website Version Updates

**Current Version:** 1.0 (December 2024)

**Next Updates Planned:**
- v1.1: Individual location pages (Jan-Feb 2025)
- v1.2: Service detail pages (Mar-Apr 2025)
- v1.3: Blog article expansion (May-Jun 2025)

---

## 📝 Final Reminders

1. **Always backup files** before making changes
2. **Test changes** in browser before going live
3. **Respond to leads within 24 hours** - this is critical!
4. **Keep phone number/email current** on all pages
5. **Monitor website health** weekly
6. **Update content monthly** for SEO benefit
7. **Back up everything** weekly to cloud storage

---

**Questions?** Check this guide first, then contact your web developer.

**Last Updated:** December 11, 2024

**Next Review:** February 2025
