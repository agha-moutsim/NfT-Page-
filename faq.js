/* ========== FAQ + FINAL CTA ==========
   Single-open accordion, live countdown timer (7-day window),
   staggered FAQ reveals. Honors prefers-reduced-motion. */
(function () {
  var section = document.getElementById('faqSection');
  if (!section) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Fire the reveal (shimmer/wipe) once in view ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          section.classList.add('in-view');
          io.disconnect();
        }
      });
    }, { threshold: 0.12 });
    io.observe(section);
  } else {
    section.classList.add('in-view');
  }

  /* ---- Accordion (single-open) ---- */
  var items = section.querySelectorAll('[data-faq]');
  items.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');

      /* Close all other items */
      items.forEach(function (other) {
        if (other !== item) {
          other.classList.remove('is-open');
          var ob = other.querySelector('.faq-question');
          if (ob) ob.setAttribute('aria-expanded', 'false');
        }
      });

      /* Toggle this item */
      if (isOpen) {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Open first item by default for visual anchoring */
  if (items.length && !reduceMotion) {
    var first = items[0];
    first.classList.add('is-open');
    var fb = first.querySelector('.faq-question');
    if (fb) fb.setAttribute('aria-expanded', 'true');
  }

  /* ---- GSAP staggered reveal for FAQ items ---- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.faq-item', {
      opacity: 0, y: 30, duration: 0.7, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.faq-list', start: 'top 82%' }
    });

    /* CTA banner subtle scale-in */
    gsap.from('.cta-content', {
      opacity: 0, y: 50, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.cta-banner', start: 'top 80%' }
    });
  } else {
    /* Fallback: ensure visible */
    section.querySelectorAll('.faq-item').forEach(function (i) {
      i.style.opacity = '1'; i.style.transform = 'none';
    });
    var cc = section.querySelector('.cta-content');
    if (cc) { cc.style.opacity = '1'; cc.style.transform = 'none'; }
  }

  /* ---- Live countdown (7 days from first load, persisted) ---- */
  var cdDays = document.getElementById('cdDays');
  var cdHours = document.getElementById('cdHours');
  var cdMins = document.getElementById('cdMins');
  var cdSecs = document.getElementById('cdSecs');
  var cdWrap = document.getElementById('ctaCountdown');

  if (cdDays && cdHours && cdMins && cdSecs && cdWrap) {
    var KEY = 'mythos_cta_deadline';
    var deadline;
    try {
      var saved = localStorage.getItem(KEY);
      if (saved) {
        deadline = parseInt(saved, 10);
      }
    } catch (e) {}
    if (!deadline || isNaN(deadline) || deadline < Date.now()) {
      deadline = Date.now() + 7 * 24 * 60 * 60 * 1000;
      try { localStorage.setItem(KEY, String(deadline)); } catch (e) {}
    }

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function renderCountdown() {
      var diff = deadline - Date.now();
      if (diff <= 0) {
        cdWrap.classList.add('is-closed');
        cdWrap.innerHTML = 'THE GATES HAVE CLOSED';
        return false;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      cdDays.textContent = pad(d);
      cdHours.textContent = pad(h);
      cdMins.textContent = pad(m);
      cdSecs.textContent = pad(s);
      return true;
    }

    /* Initial render */
    var stillOpen = renderCountdown();

    var tickId = null;
    function startTicking() {
      if (tickId || reduceMotion || !stillOpen) return;
      tickId = setInterval(function () {
        stillOpen = renderCountdown();
        if (!stillOpen) { clearInterval(tickId); tickId = null; }
      }, 1000);
    }
    function stopTicking() {
      if (tickId) { clearInterval(tickId); tickId = null; }
    }

    /* Pause when off-screen for perf */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) startTicking();
          else stopTicking();
        });
      }, { threshold: 0 }).observe(cdWrap);
    } else {
      startTicking();
    }
  }

  /* ---- CTA mint button feedback (mirrors mint.js) ---- */
  var ctaBtn = document.getElementById('ctaMintBtn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function () {
      var span = ctaBtn.querySelector('span');
      var original = span.textContent;
      ctaBtn.disabled = true;
      span.textContent = 'CONNECTING...';
      setTimeout(function () {
        span.textContent = 'WALLET NEEDED';
        setTimeout(function () {
          span.textContent = original;
          ctaBtn.disabled = false;
        }, 1800);
      }, 1600);
    });
  }

  /* ---- Refresh ScrollTrigger after load + on resize ---- */
  window.addEventListener('load', function () {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }, 250);
  });
})();

/* ========== FOOTER WORDMARK AUTO-FIT ==========
   Measures the real rendered width of "MYTHOS" and sizes the
   font so the wordmark fills the container perfectly on every
   screen — never clips, always centered, always maximal. */
(function () {
  var wm = document.querySelector('.footer-wordmark');
  if (!wm) return;
  var container = wm.parentElement; /* .footer-inner */
  if (!container) return;

  var MAX_FONT = 260;   /* px cap — keeps it aesthetic, not absurd */
  var MIN_FONT = 38;    /* px floor */
  var FILL = 0.94;      /* target 94% of container width */

  function fit() {
    /* Reset to a known size so measurement is predictable */
    wm.style.fontSize = '100px';
    var w100 = wm.scrollWidth;
    if (!w100) return;
    var emWidth = w100 / 100; /* px-width per 1em at 100px font */

    var maxW = container.clientWidth - 8; /* tiny safety margin */
    var desired = (maxW * FILL) / emWidth;
    desired = Math.max(MIN_FONT, Math.min(desired, MAX_FONT));
    wm.style.fontSize = Math.floor(desired) + 'px';
  }

  /* Wait for the Syne font to load so measurement is accurate */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fit);
  }
  fit();

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(fit, 120);
  });
  window.addEventListener('load', fit);
})();
