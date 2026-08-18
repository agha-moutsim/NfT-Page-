/* ========== ROADMAP TIMELINE ==========
   Vertical timeline with a scroll-driven fill line and
   staggered phase-card reveals. Honors prefers-reduced-motion. */
(function () {
  var section = document.getElementById('roadmapSection');
  if (!section) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  var isMobile = isTouch || window.innerWidth < 768;

  /* ---- Fire the reveal (shimmer/wipe) once in view ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          section.classList.add('in-view');
          io.disconnect();
        }
      });
    }, { threshold: 0.15 });
    io.observe(section);
  } else {
    section.classList.add('in-view');
  }

  /* ---- GSAP: timeline fill + phase card reveals ---- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    var fill = document.getElementById('timelineFill');
    var timeline = document.getElementById('timeline');

    /* Timeline fill grows as the user scrolls through the timeline */
    if (fill && timeline) {
      gsap.fromTo(fill,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          transformOrigin: 'top center',
          scrollTrigger: {
            trigger: timeline,
            start: 'top 70%',
            end: 'bottom 80%',
            scrub: 0.8
          }
        }
      );
    }

    /* Phase cards: slide in from their side (desktop only — mobile uses a single direction) */
    if (!isMobile) {
      var leftCards = section.querySelectorAll('.phase.left .phase-card');
      var rightCards = section.querySelectorAll('.phase.right .phase-card');

      if (leftCards.length) {
        gsap.from(leftCards, {
          opacity: 0, x: -40, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: timeline, start: 'top 70%' }
        });
      }
      if (rightCards.length) {
        gsap.from(rightCards, {
          opacity: 0, x: 40, duration: 0.8, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: timeline, start: 'top 70%' }
        });
      }
    } else {
      /* On mobile, all cards come from the right (line is on the left) */
      var allCards = section.querySelectorAll('.phase-card');
      gsap.from(allCards, {
        opacity: 0, x: 30, duration: 0.7, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: timeline, start: 'top 75%' }
      });
    }
  } else {
    /* Reduced-motion / no-GSAP fallback: ensure everything is visible */
    var cards = section.querySelectorAll('.phase-card');
    cards.forEach(function (c) { c.style.opacity = '1'; c.style.transform = 'none'; });
    var fillEl = document.getElementById('timelineFill');
    if (fillEl) { fillEl.style.height = '100%'; fillEl.style.transform = 'none'; }
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
