// Siliguri Security Services — main.js
// Email-first lead capture, WhatsApp continuation, modal management.

(function () {
  "use strict";

  const PHONE_DIGITS = "919547253232";
  const PHONE_DISPLAY = "+91-95472-53232";
  const PHONE_REGEX = /^[0-9+\-\s()]{10,15}$/;

  ready(init);

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function init() {
    initMobileMenu();
    initSiteVisitModal();
    initLeadForms();
    initFaqAccordion();
    initSmoothScroll();
    initAnalyticsEvents();
    initLightbox();
    initJobRolePrefill();
    initRevealOnScroll();
    initHeaderShadowOnScroll();
  }

  // ---------------- Mobile menu ----------------
  function initMobileMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector("nav ul");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("active");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    menu.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        menu.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  // ---------------- Site visit modal ----------------
  function initSiteVisitModal() {
    const modal = document.getElementById("site-visit-modal");
    if (!modal) return;

    let lastFocused = null;

    document.addEventListener("click", (e) => {
      const opener = e.target.closest(".js-open-site-visit");
      if (opener) {
        e.preventDefault();
        lastFocused = opener;
        const prefillLoc = opener.getAttribute("data-prefill-location");
        const prefillSvc = opener.getAttribute("data-prefill-service");
        if (prefillLoc) {
          const locField = modal.querySelector("[name=location]");
          if (locField) locField.value = prefillLoc;
        }
        if (prefillSvc) {
          const notesField = modal.querySelector("[name=notes]");
          if (notesField && !notesField.value) {
            notesField.value = "Interested in: " + prefillSvc;
          }
        }
        openModal(modal);
      }
      if (e.target.closest(".js-close-modal")) {
        closeModal(modal);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal(modal);
    });

    function openModal(m) {
      m.hidden = false;
      document.body.classList.add("modal-open");
      const focusable = m.querySelector("input, select, textarea, button");
      if (focusable) focusable.focus();
    }
    function closeModal(m) {
      m.hidden = true;
      document.body.classList.remove("modal-open");
      if (lastFocused) lastFocused.focus();
    }
  }

  // ---------------- Lead forms ----------------
  function initLeadForms() {
    document.querySelectorAll(".lead-form").forEach((form) => {
      form.addEventListener("submit", (e) => handleSubmit(e, form));
    });
  }

  async function handleSubmit(e, form) {
    e.preventDefault();
    const status = form.querySelector(".form-status");
    const submitBtn = form.querySelector("button[type=submit]");

    setStatus(status, "", "");

    // Honeypot check
    const honeypot = form.querySelector(".hp-field");
    if (honeypot && honeypot.value.trim() !== "") {
      setStatus(status, "Sorry, something looks off. Please try again.", "error");
      return;
    }

    // Phone is mandatory
    const phoneEl = form.querySelector("[name=phone]");
    if (!phoneEl || !PHONE_REGEX.test(phoneEl.value.trim())) {
      setStatus(status, "Please enter a valid phone number (10–15 digits).", "error");
      if (phoneEl) phoneEl.focus();
      return;
    }

    // Name presence
    const nameEl = form.querySelector("[name=name]");
    if (nameEl && nameEl.value.trim().length < 2) {
      setStatus(status, "Please tell us your name.", "error");
      nameEl.focus();
      return;
    }

    // Browser-native validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = formToObject(form);
    payload.pageUrl = window.location.href;
    payload.pageTitle = document.title;
    payload.submittedAt = new Date().toISOString();

    const endpoint = form.getAttribute("data-endpoint") || "/api/lead";
    const isQuote = endpoint.indexOf("/api/lead") !== -1;
    payload.formType = isQuote ? "quote" : "site-visit";

    submitBtn.disabled = true;
    setStatus(status, "Sending… please wait.", "pending");

    let serverOk = false;
    let whatsappUrl = buildWhatsAppFallback(payload);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body && body.whatsappUrl) whatsappUrl = body.whatsappUrl;
        serverOk = true;
      } else {
        const errBody = await res.json().catch(() => ({}));
        if (res.status === 400 && errBody.error) {
          setStatus(status, errBody.error, "error");
          submitBtn.disabled = false;
          return;
        }
      }
    } catch (_err) {
      // Network error — fall through to WhatsApp fallback so we don't lose the lead
    }

    track("lead_submitted", { formType: payload.formType, serverOk });

    setStatus(
      status,
      serverOk
        ? "Thanks! We received your enquiry by email. WhatsApp will open so you can also send us a message."
        : "We couldn't reach our email server right now — opening WhatsApp so your enquiry still gets to us.",
      serverOk ? "success" : "warning"
    );

    setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 1200);
  }

  function buildWhatsAppFallback(payload) {
    const lines = [];
    lines.push("Hello " + PHONE_DISPLAY + ", I'd like to enquire about your services.");
    lines.push("");
    if (payload.name) lines.push("Name: " + payload.name);
    if (payload.company) lines.push("Company: " + payload.company);
    if (payload.phone) lines.push("Phone: " + payload.phone);
    if (payload.email) lines.push("Email: " + payload.email);
    if (payload.location) lines.push("Location: " + payload.location);
    if (payload.serviceType) lines.push("Service: " + payload.serviceType);
    if (payload.guardCount) lines.push("Guards needed: " + payload.guardCount);
    if (payload.guardTier) lines.push("Tier: " + payload.guardTier);
    if (payload.preferredDate) lines.push("Preferred date: " + payload.preferredDate);
    if (payload.preferredTime) lines.push("Preferred time: " + payload.preferredTime);
    if (payload.notes) lines.push("Notes: " + payload.notes);
    return "https://wa.me/" + PHONE_DIGITS + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function formToObject(form) {
    const data = new FormData(form);
    const obj = {};
    data.forEach((value, key) => {
      if (key === "company_website") return; // honeypot
      obj[key] = typeof value === "string" ? value.trim() : value;
    });
    return obj;
  }

  function setStatus(el, message, level) {
    if (!el) return;
    el.textContent = message;
    el.className = "form-status";
    if (level) el.classList.add("form-status-" + level);
  }

  // ---------------- FAQ ----------------
  function initFaqAccordion() {
    document.querySelectorAll(".faq dt").forEach((dt) => {
      dt.setAttribute("role", "button");
      dt.tabIndex = 0;
      dt.addEventListener("click", () => dt.parentElement.classList.toggle("open"));
      dt.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          dt.parentElement.classList.toggle("open");
        }
      });
    });
  }

  // ---------------- Smooth scroll ----------------
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (href.length > 1 && document.querySelector(href)) {
          e.preventDefault();
          document.querySelector(href).scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // ---------------- Analytics events ----------------
  function initAnalyticsEvents() {
    document.querySelectorAll('a[href^="tel:"]').forEach((a) =>
      a.addEventListener("click", () => track("call_click", { number: a.getAttribute("href") }))
    );
    document.querySelectorAll('a[href*="wa.me/"], [data-track="whatsapp_click"]').forEach((a) =>
      a.addEventListener("click", () => track("whatsapp_click", { source: location.pathname }))
    );
  }

  function track(event, data) {
    try {
      if (window.dataLayer) window.dataLayer.push({ event, ...(data || {}) });
      if (window.gtag) window.gtag("event", event, data || {});
    } catch (_) {}
  }

  // ---------------- Scroll-triggered reveal ----------------
  function initRevealOnScroll() {
    if (!("IntersectionObserver" in window)) return;
    // Apply reveal classes to common content blocks
    const targets = document.querySelectorAll([
      ".section-header",
      ".card-grid",
      ".chip-grid",
      ".job-grid",
      ".photo-grid",
      ".testimonial-grid",
      ".trust-grid",
      ".compliance-grid",
      ".join-us-text",
      ".join-us-collage",
      ".timeline",
      ".steps",
      ".steps-grid",
      ".faq",
      ".data-table"
    ].join(","));
    targets.forEach((el) => {
      // grids get stagger; everything else fades as a unit
      if (el.matches(".card-grid, .chip-grid, .job-grid, .photo-grid, .testimonial-grid, .trust-grid, .compliance-grid")) {
        el.classList.add("reveal-stagger");
      } else {
        el.classList.add("reveal");
      }
    });

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

    document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => io.observe(el));
  }

  // ---------------- Header shadow when scrolled ----------------
  function initHeaderShadowOnScroll() {
    const header = document.querySelector("header");
    if (!header) return;
    let scheduled = false;
    function update() {
      scheduled = false;
      if (window.scrollY > 4) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    window.addEventListener("scroll", () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  // ---------------- Photo gallery lightbox ----------------
  function initLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    const imgEl = document.getElementById("lightbox-img");
    const captionEl = document.getElementById("lightbox-caption");
    const tiles = Array.from(document.querySelectorAll(".js-open-lightbox"));
    if (!tiles.length) return;

    let currentIndex = 0;
    let touchStartX = 0;

    function open(index) {
      currentIndex = (index + tiles.length) % tiles.length;
      const tile = tiles[currentIndex];
      const sourceImg = tile.querySelector("img");
      const caption = tile.querySelector(".photo-grid-caption");
      if (!sourceImg) return;
      imgEl.src = sourceImg.currentSrc || sourceImg.src;
      imgEl.alt = sourceImg.alt || "";
      captionEl.textContent = caption ? caption.textContent : sourceImg.alt || "";
      lightbox.hidden = false;
      document.body.classList.add("modal-open");
      lightbox.querySelector(".lightbox-close").focus();
    }
    function close() {
      lightbox.hidden = true;
      document.body.classList.remove("modal-open");
      const original = tiles[currentIndex];
      if (original) original.focus();
    }
    function prev() { open(currentIndex - 1); }
    function next() { open(currentIndex + 1); }

    tiles.forEach((t, i) => t.addEventListener("click", () => open(i)));
    lightbox.addEventListener("click", (e) => {
      if (e.target.closest(".js-close-lightbox") || e.target === lightbox) close();
      else if (e.target.closest(".js-prev-lightbox")) prev();
      else if (e.target.closest(".js-next-lightbox")) next();
    });
    document.addEventListener("keydown", (e) => {
      if (lightbox.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    });
    lightbox.addEventListener("touchstart", (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
    }, { passive: true });
  }

  // ---------------- Job apply: prefill role + scroll ----------------
  function initJobRolePrefill() {
    document.querySelectorAll(".job-apply").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const role = btn.getAttribute("data-prefill-role");
        if (!role) return;
        e.preventDefault();
        const select = document.getElementById("ja-role");
        if (select) {
          for (const opt of select.options) {
            if (opt.value === role) { select.value = role; break; }
          }
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        const target = document.getElementById("apply");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          const name = document.getElementById("ja-name");
          if (name) name.focus();
        }, 500);
      });
    });
  }
})();
