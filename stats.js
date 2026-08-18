/* ========== STATS + SOCIAL PROOF ==========
   Animated count-up numbers, mint progress bar, partner marquee,
   and a live Discord-style community counter. Triggers on scroll
   via IntersectionObserver. Honors prefers-reduced-motion. */
(function () {
  var section = document.getElementById('statsSection');
  if (!section) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Set bar fill widths from data attributes ---- */
  section.querySelectorAll('.stat-bar-fill').forEach(function (b) {
    var f = b.getAttribute('data-fill');
    if (f) b.style.setProperty('--fill', f);
  });

  /* ---- Easing ---- */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  /* ---- Number formatting (thousands separators + decimals) ---- */
  function formatNum(n, decimals) {
    var fixed = n.toFixed(decimals);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /* ---- Count-up for a single element ---- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 2000;

    if (reduceMotion) {
      el.textContent = prefix + formatNum(target, decimals) + suffix;
      return;
    }

    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var v = target * easeOutExpo(p);
      el.textContent = prefix + formatNum(v, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + formatNum(target, decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---- Trigger on view ---- */
  var fired = false;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          section.classList.add('in-view');
          section.querySelectorAll('.stat-num, .community-count').forEach(function (n) {
            animateCount(n);
          });
          io.disconnect();
        }
      });
    }, { threshold: 0.25 });
    io.observe(section);
  } else {
    /* Fallback: reveal immediately */
    section.classList.add('in-view');
    section.querySelectorAll('.stat-num, .community-count').forEach(function (n) {
      animateCount(n);
    });
  }

  /* ---- GSAP staggered reveal (matches other sections) ---- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('.stat-card', {
      opacity: 0, y: 40, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.stats-grid', start: 'top 82%' }
    });
  }

  /* ---- Pause marquee when off-screen (perf) ---- */
  var marquee = section.querySelector('.marquee-track');
  if (marquee && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        marquee.style.animationPlayState = en.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0 }).observe(marquee);
  }

  /* ---- Refresh ScrollTrigger after load ---- */
  window.addEventListener('load', function () {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });
})();
