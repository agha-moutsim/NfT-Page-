gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById("hero-canvas");
const context = canvas.getContext("2d");

// Set canvas dimensions (assuming standard 1920x1080)
canvas.width = 1920;
canvas.height = 1080;

const frameCount = 240; // You have 240 frames in the folder
const currentFrame = index => (
  `frames/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`
);

const images = [];
const videoTrack = { frame: 0 };

// Preload all images so there is zero delay when scrubbing
let loadedCount = 0;
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = currentFrame(i);
  img.onload = () => {
    loadedCount++;
    if (loadedCount === frameCount) {
      initScrollAnimation(); 
    }
  };
  images.push(img);
}

function initScrollAnimation() {
  // Draw the very first frame immediately
  renderCanvas();

  gsap.to(videoTrack, {
    frame: frameCount - 1,
    ease: "none",  // Keeps the scroll movement linear with scroll
    scrollTrigger: {
      trigger: "#scroll-container",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5, // Increased scrub delay for a silkier, buttery smooth feel
    }
  });

  // Typography and UI Animation
  gsap.to(".hero-title", {
    scale: 3,
    opacity: 0,
    ease: "power2.inOut",
    scrollTrigger: {
      trigger: "#scroll-container",
      start: "top top",
      end: "top -50%", 
      scrub: 1.5,
    }
  });

  gsap.to(".scroll-indicator", {
    opacity: 0,
    ease: "power2.out",
    scrollTrigger: {
      trigger: "#scroll-container",
      start: "top top",
      end: "top -20%", 
      scrub: 1.5,
    }
  });
}

// Decouple canvas drawing from GSAP updates using requestAnimationFrame for maximum performance
let renderRequested = false;
function renderCanvas() {
  const frameIndex = Math.round(videoTrack.frame);
  if (images[frameIndex]) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(images[frameIndex], 0, 0, canvas.width, canvas.height);
  }
  renderRequested = false;
}

// Global animation loop to ensure we only paint on screen refreshes
function animationLoop() {
  if (!renderRequested) {
    renderRequested = true;
    requestAnimationFrame(() => {
      renderCanvas();
      animationLoop();
    });
  }
}
animationLoop();

// Ensure trigger calculations are correct after everything renders
window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});

// ---------- NFT Collection Logic ----------
const section = document.getElementById('nftSection');
if (section) {
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        section.classList.add('in-view');
        io.disconnect();
      }
    });
  }, { threshold: 0.2 });
  io.observe(section);

  // Ambient cursor spotlight with smoothing (skipped for touch / reduced motion)
  const glow = document.getElementById('glow');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(!reduceMotion && glow){
    let tx = window.innerWidth/2, ty = window.innerHeight*0.2;
    let cx = tx, cy = ty;

    section.addEventListener('mousemove', (e)=>{
      const rect = section.getBoundingClientRect();
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
    });

    function animateGlow(){
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      glow.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(animateGlow);
    }
    requestAnimationFrame(animateGlow);
  }
}

// ---------- MYTHOS Carousel Logic + Premium Effects ----------
(function() {
  const section = document.getElementById('mythosSection');
  const items = document.querySelectorAll('.carousel-item');
  const counter = document.getElementById('carouselCounter');
  const infoIndex = document.getElementById('infoIndex');
  const infoTitle = document.getElementById('infoTitle');
  const mythosTitle = document.getElementById('mythosTitle');
  const mythosVersion = document.getElementById('mythosVersion');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const radialGlow = document.getElementById('radialGlow');

  if (!items.length || !prevBtn || !nextBtn || !section) return;

  const titles = [
    'Modern Renaissance',
    'Divine Wrath',
    'Ethereal Vision',
    'Golden Deity'
  ];

  const glowColors = [
    'radial-gradient(circle, rgba(216,182,113,0.28) 0%, rgba(95,179,189,0.12) 40%, transparent 70%)',
    'radial-gradient(circle, rgba(180,60,60,0.25) 0%, rgba(216,182,113,0.10) 40%, transparent 70%)',
    'radial-gradient(circle, rgba(95,179,189,0.30) 0%, rgba(130,100,220,0.12) 40%, transparent 70%)',
    'radial-gradient(circle, rgba(216,182,113,0.32) 0%, rgba(255,220,120,0.10) 40%, transparent 70%)'
  ];

  const total = items.length;
  let current = 0;
  let isAnimating = false;

  // ====== SPLIT-TEXT HELPER ======
  function splitTextInto(el, text) {
    el.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') {
        const space = document.createElement('span');
        space.className = 'letter-space';
        el.appendChild(space);
      } else {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = text[i];
        el.appendChild(span);
      }
    }
  }

  function revealLetters(el) {
    const letters = el.querySelectorAll('.letter');
    letters.forEach((letter, i) => {
      setTimeout(() => {
        letter.classList.add('visible');
      }, i * 35);
    });
  }

  function animateText(el, text) {
    // First, hide current letters
    const oldLetters = el.querySelectorAll('.letter');
    oldLetters.forEach(l => l.classList.remove('visible'));

    setTimeout(() => {
      splitTextInto(el, text);
      revealLetters(el);
    }, 200);
  }

  // ====== CAROUSEL POSITION MAP ======
  function getClass(offset) {
    if (offset === 0) return 'active';
    if (offset === 1) return 'next';
    if (offset === -1 || offset === total - 1) return 'prev';
    if (offset === 2) return 'hidden-next';
    return 'hidden-prev';
  }

  function updateCarousel() {
    items.forEach((item, i) => {
      item.classList.remove('active', 'prev', 'next', 'hidden-prev', 'hidden-next');
      let offset = (i - current + total) % total;
      item.classList.add(getClass(offset));
    });

    // Update counter
    const num = String(current + 1).padStart(2, '0');
    if (counter) counter.textContent = `[${num}/${String(total).padStart(2, '0')}]`;

    // Split-text animations
    if (infoIndex) animateText(infoIndex, `[${num}]`);
    if (infoTitle) animateText(infoTitle, titles[current] || `Artwork ${current + 1}`);

    // Update radial glow color
    if (radialGlow) {
      radialGlow.style.background = glowColors[current] || glowColors[0];
    }
  }

  function goNext() {
    if (isAnimating) return;
    isAnimating = true;
    current = (current + 1) % total;
    updateCarousel();
    setTimeout(() => { isAnimating = false; }, 800);
  }

  function goPrev() {
    if (isAnimating) return;
    isAnimating = true;
    current = (current - 1 + total) % total;
    updateCarousel();
    setTimeout(() => { isAnimating = false; }, 800);
  }

  nextBtn.addEventListener('click', goNext);
  prevBtn.addEventListener('click', goPrev);

  // ====== 3D PARALLAX TILT ======
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    let tiltX = 0, tiltY = 0;
    let currentTiltX = 0, currentTiltY = 0;

    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Map to tilt range: -12 to 12 degrees
      tiltY = (x - 0.5) * 24;
      tiltX = (0.5 - y) * 16;

      // Move radial glow towards cursor
      if (radialGlow) {
        const glowX = (x - 0.5) * 80;
        const glowY = (y - 0.5) * 80;
        radialGlow.style.transform = `translate(calc(-50% + ${glowX}px), calc(-50% + ${glowY}px))`;
      }
    });

    section.addEventListener('mouseleave', () => {
      tiltX = 0;
      tiltY = 0;
      if (radialGlow) {
        radialGlow.style.transform = 'translate(-50%, -50%)';
      }
    });

    function animateTilt() {
      currentTiltX += (tiltX - currentTiltX) * 0.08;
      currentTiltY += (tiltY - currentTiltY) * 0.08;

      const activeItem = section.querySelector('.carousel-item.active img');
      if (activeItem) {
        activeItem.style.transform = `rotateX(${currentTiltX}deg) rotateY(${currentTiltY}deg)`;
      }

      requestAnimationFrame(animateTilt);
    }
    requestAnimationFrame(animateTilt);
  }

  // ====== SCROLL-TRIGGERED ENTRY ANIMATION ======
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    // Set initial states
    gsap.set('.mythos-top-left', { opacity: 0, x: -60 });
    gsap.set('.mythos-right-middle', { opacity: 0, x: 60 });
    gsap.set('.mythos-center-top', { opacity: 0, y: -30 });
    gsap.set('.mythos-center-bottom', { opacity: 0, y: 30 });
    gsap.set('.carousel-track', { opacity: 0, scale: 0.85 });
    gsap.set('.radial-glow', { opacity: 0, scale: 0.5 });
    // Hide split-text letters — GSAP reveals them in the timeline below
    gsap.set('#mythosTitle .letter', { opacity: 0, scale: 0, y: 40, rotation: -15 });
    gsap.set('#mythosVersion .letter', { opacity: 0, scale: 0, y: 40, rotation: -15 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#mythosSection',
        start: 'top 75%',
        end: 'top 20%',
        toggleActions: 'play none none none',
      }
    });

    tl.to('.carousel-track', {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: 'power3.out'
    })
    .to('.radial-glow', {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.9')
    .to('.mythos-top-left', {
      opacity: 1,
      x: 0,
      duration: 0.1, // just reveal container instantly, we animate letters next
      ease: 'power3.out'
    }, '-=0.7')
    .to('#mythosTitle .letter', {
      opacity: 1,
      scale: 1,
      y: 0,
      rotation: 0,
      duration: 1.2,
      stagger: 0.05,
      ease: 'elastic.out(1, 0.4)'
    }, '-=0.8')
    .to('#mythosVersion .letter', {
      opacity: 1,
      scale: 1,
      y: 0,
      rotation: 0,
      duration: 1,
      stagger: 0.04,
      ease: 'elastic.out(1, 0.5)'
    }, '-=1.0')
    .to('.mythos-right-middle', {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.8')
    .to('.mythos-center-top', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.5')
    .to('.mythos-center-bottom', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.4');

    // ====== SAFETY NET: force visibility if ScrollTrigger hasn't fired ======
    setTimeout(() => {
      const tl = section.querySelector('.mythos-top-left');
      const rm = section.querySelector('.mythos-right-middle');
      const ct = section.querySelector('.mythos-center-top');
      const cb = section.querySelector('.mythos-center-bottom');
      const track = section.querySelector('.carousel-track');
      const glow = section.querySelector('.radial-glow');
      const allLetters = section.querySelectorAll('#mythosTitle .letter, #mythosVersion .letter');

      let needsFallback = false;
      if (tl && parseFloat(getComputedStyle(tl).opacity) < 0.1) needsFallback = true;

      if (needsFallback) {
        [{el:tl,props:{opacity:1,x:0}},{el:rm,props:{opacity:1,x:0}},
         {el:ct,props:{opacity:1,y:0}},{el:cb,props:{opacity:1,y:0}},
         {el:track,props:{opacity:1,scale:1}},{el:glow,props:{opacity:1,scale:1}}
        ].forEach(o => { if (o.el) gsap.set(o.el, o.props); });
        allLetters.forEach(l => gsap.set(l, {opacity:1, scale:1, y:0, rotation:0}));
      }
    }, 3500);
  }

  // INITIALIZE
  // Initial split-text setup
  if (infoTitle) {
    splitTextInto(infoTitle, titles[0]);
    setTimeout(() => revealLetters(infoTitle), 600);
  }
  if (infoIndex) {
    splitTextInto(infoIndex, '[01]');
    setTimeout(() => revealLetters(infoIndex), 500);
  }
  
  if (mythosTitle) {
    splitTextInto(mythosTitle, mythosTitle.textContent);
  }
  if (mythosVersion) {
    splitTextInto(mythosVersion, mythosVersion.textContent);
  }

  // Set initial glow
  if (radialGlow) {
    radialGlow.style.background = glowColors[0];
  }

  // Set initial carousel classes (without triggering text animation again)
  items.forEach((item, i) => {
    item.classList.remove('active', 'prev', 'next', 'hidden-prev', 'hidden-next');
    let offset = (i - current + total) % total;
    item.classList.add(getClass(offset));
  });
  const num = String(current + 1).padStart(2, '0');
  if (counter) counter.textContent = `[${num}/${String(total).padStart(2, '0')}]`;
})();
