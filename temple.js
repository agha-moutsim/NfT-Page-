/* ========== TEMPLE 3D GALLERY ==========
   Three.js (r128 UMD global). Scroll-driven camera dolly through a
   marble hall with floating, gold-framed deity NFT cards.
   Reuses GSAP ScrollTrigger from the page. Honors prefers-reduced-motion. */
(function () {
  var canvas = document.getElementById('temple-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobile detection ---- */
  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  var isMobile = isTouch || window.innerWidth < 768;
  var dprCap = isMobile ? 1.5 : 2;

  /* ---- Renderer ---- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.physicallyCorrectLights = true;

  /* ---- Scene + camera ---- */
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b10);
  scene.fog = new THREE.FogExp2(0x070b10, 0.04);

  function getCameraFov() {
    var aspect = window.innerWidth / window.innerHeight;
    /* Wider FOV on narrow/mobile screens so the hall and cards stay visible */
    if (aspect < 0.6) return 72;
    if (aspect < 0.85) return 65;
    return 55;
  }
  var camera = new THREE.PerspectiveCamera(getCameraFov(), window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2.2, 14);

  /* ---- Procedural gradient environment map (no external HDR) ---- */
  (function makeEnv() {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, '#0a1218');
    g.addColorStop(0.45, '#2a2012');
    g.addColorStop(0.62, '#d8b671');
    g.addColorStop(0.78, '#1a3a3f');
    g.addColorStop(1.00, '#070b10');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256);
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(tex).texture;
  })();

  /* ---- Lights ---- */
  scene.add(new THREE.AmbientLight(0x223040, 0.5));
  scene.add(new THREE.HemisphereLight(0xbfd4e0, 0x140d05, 0.35));
  var key = new THREE.DirectionalLight(0xfff0d0, 0.6);
  key.position.set(6, 12, 10);
  scene.add(key);

  /* ---- Floor: dark polished reflective stone ---- */
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 240),
    new THREE.MeshStandardMaterial({ color: 0x0a1014, metalness: 0.7, roughness: 0.22, envMapIntensity: 1.0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -10);
  scene.add(floor);

  /* ---- Scene layout scale (narrower hall on mobile) ---- */
  var layoutScale = (window.innerWidth / window.innerHeight < 0.75) ? 0.78 : 1.0;

  /* ---- Doric columns, two rows ---- */
  var stoneMat = new THREE.MeshStandardMaterial({
    color: 0x141a22, metalness: 0.55, roughness: 0.38, envMapIntensity: 1.0
  });
  var goldMat = new THREE.MeshStandardMaterial({
    color: 0xd8b671, metalness: 1.0, roughness: 0.28,
    emissive: 0x2a1d08, emissiveIntensity: 0.5, envMapIntensity: 1.3
  });
  var shaftGeo = new THREE.CylinderGeometry(0.7, 0.82, 12, 28, 1);
  var baseGeo = new THREE.BoxGeometry(1.9, 0.6, 1.9);
  var capGeo = new THREE.BoxGeometry(1.9, 0.5, 1.9);
  var colX = 7.2 * layoutScale;
  for (var z = 16; z >= -32; z -= 6) {
    [-colX, colX].forEach(function (x) {
      var shaft = new THREE.Mesh(shaftGeo, stoneMat); shaft.position.set(x, 6, z); scene.add(shaft);
      var base = new THREE.Mesh(baseGeo, goldMat); base.position.set(x, 0.3, z); scene.add(base);
      var cap = new THREE.Mesh(capGeo, goldMat); cap.position.set(x, 12.25, z); scene.add(cap);
    });
  }

  /* ---- Radial glow sprite texture (additive) ---- */
  var glowTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.00, 'rgba(255,228,160,1)');
    g.addColorStop(0.22, 'rgba(216,182,113,0.55)');
    g.addColorStop(0.55, 'rgba(216,182,113,0.14)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();

  /* ---- Floating deity cards (reuse existing bust PNGs) ---- */
  var deityImages = [
    'images/ChatGPT Image Jul 16, 2026, 02_37_54 PM.png',
    'images/ChatGPT Image Jul 16, 2026, 02_38_02 PM.png',
    'images/ChatGPT Image Jul 16, 2026, 02_38_08 PM.png',
    'images/ChatGPT Image Jul 16, 2026, 02_38_13 PM.png'
  ];
  var titles = ['Modern Renaissance', 'Divine Wrath', 'Ethereal Vision', 'Golden Deity'];
  var cardZ = [6, -2, -10, -18];
  var loader = new THREE.TextureLoader();
  var cards = [];

  var cardScale = isMobile ? 1.15 : 1.0;
  deityImages.forEach(function (src, i) {
    var group = new THREE.Group();
    group.scale.set(cardScale, cardScale, cardScale);

    var frameMat = new THREE.MeshStandardMaterial({
      color: 0xd8b671, metalness: 1.0, roughness: 0.25,
      emissive: 0x3a2a10, emissiveIntensity: 0.7, envMapIntensity: 1.3
    });
    var frame = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.4, 0.12), frameMat);
    group.add(frame);

    var tex = loader.load(src);
    tex.encoding = THREE.sRGBEncoding;
    var imgMat = new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.4,
      metalness: 0.2, roughness: 0.55, envMapIntensity: 0.4
    });
    var img = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 4.0), imgMat);
    img.position.z = 0.07;
    group.add(img);

    group.position.set(0, 2.4, cardZ[i]);
    group.userData.baseY = 2.4;
    group.userData.phase = i * 1.7;
    scene.add(group);

    var spot = new THREE.SpotLight(0xffe6b0, 6.0, 16, Math.PI / 6, 0.5, 1.3);
    spot.position.set(0, 11, cardZ[i]);
    spot.target.position.set(0, 2.4, cardZ[i]);
    scene.add(spot); scene.add(spot.target);

    var glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending, transparent: true,
      depthWrite: false, opacity: 0.9
    }));
    glow.scale.set(7.5, 7.5, 1);
    glow.position.set(0, 2.4, cardZ[i] - 0.6);
    scene.add(glow);

    var warm = new THREE.PointLight(0xd8b671, 1.2, 9, 2);
    warm.position.set(0, 2.4, cardZ[i] + 1.4);
    scene.add(warm);

    cards.push(group);
  });

  /* ---- Volumetric god-ray beams (crossed additive planes) ---- */
  var beamTex = (function () {
    var c = document.createElement('canvas'); c.width = 64; c.height = 256;
    var ctx = c.getContext('2d');
    var vg = ctx.createLinearGradient(0, 0, 0, 256);
    vg.addColorStop(0.00, 'rgba(255,232,180,0.0)');
    vg.addColorStop(0.08, 'rgba(255,232,180,0.9)');
    vg.addColorStop(0.35, 'rgba(216,182,113,0.45)');
    vg.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 64, 256);
    ctx.globalCompositeOperation = 'destination-in';
    var hg = ctx.createLinearGradient(0, 0, 64, 0);
    hg.addColorStop(0.00, 'rgba(0,0,0,0)');
    hg.addColorStop(0.50, 'rgba(0,0,0,1)');
    hg.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, 64, 256);
    ctx.globalCompositeOperation = 'source-over';
    return new THREE.CanvasTexture(c);
  })();

  var beams = [];
  [12, 4, -4, -12, -20].forEach(function (bz, i) {
    var grp = new THREE.Group();
    var bm = new THREE.MeshBasicMaterial({
      map: beamTex, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    var p1 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 14), bm);
    var p2 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 14), bm);
    p2.rotation.y = Math.PI / 2;
    grp.add(p1); grp.add(p2);
    grp.position.set((i % 2 === 0 ? -1.8 * layoutScale : 1.8 * layoutScale), 7, bz);
    grp.rotation.z = (i % 2 === 0 ? 0.3 : -0.3);
    grp.userData.mat = bm;
    grp.userData.baseOp = 0.5;
    grp.userData.phase = i * 1.3;
    scene.add(grp);
    beams.push(grp);
  });

  /* ---- Floating gold dust motes ---- */
  var dustTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 32;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0.00, 'rgba(255,236,190,1)');
    g.addColorStop(0.40, 'rgba(216,182,113,0.5)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();

  var DUST = isMobile ? 240 : 520;
  var dPos = new Float32Array(DUST * 3);
  var dPhase = new Float32Array(DUST);
  var dSpeed = new Float32Array(DUST);
  for (var d = 0; d < DUST; d++) {
    dPos[d * 3 + 0] = (Math.random() * 2 - 1) * 9;
    dPos[d * 3 + 1] = 0.5 + Math.random() * 10.5;
    dPos[d * 3 + 2] = 16 - Math.random() * 48;
    dPhase[d] = Math.random() * Math.PI * 2;
    dSpeed[d] = 0.15 + Math.random() * 0.25;
  }
  var dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  var dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    size: 0.13, map: dustTex, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending,
    sizeAttenuation: true, color: 0xffe6b0
  }));
  scene.add(dust);

  /* ---- Postprocessing: cinematic bloom ---- */
  var composer = null;
  if (typeof THREE.EffectComposer !== 'undefined') {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    var bloomRes = isMobile ? 0.6 : 1.0;
    composer.addPass(new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth * bloomRes, window.innerHeight * bloomRes), 0.7, 0.5, 0.7
    ));
    if (typeof THREE.GammaCorrectionShader !== 'undefined') {
      composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
    }
  }

  /* ---- Scroll-driven camera dolly ---- */
  var progress = { v: 0 };
  var startZ = 14, endZ = -22;

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    if (!reduceMotion) {
      gsap.to(progress, {
        v: 1, ease: 'none',
        scrollTrigger: {
          trigger: '#templeScroll',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.2
        }
      });
      gsap.to('.temple-title', {
        opacity: 0, y: -40, ease: 'power2.out',
        scrollTrigger: { trigger: '#templeScroll', start: 'top top', end: '25% top', scrub: 1 }
      });
      gsap.to('.temple-hint', {
        opacity: 0, ease: 'power2.out',
        scrollTrigger: { trigger: '#templeScroll', start: 'top top', end: '8% top', scrub: 1 }
      });
    } else {
      progress.v = 0.28;
    }
  }

  /* ---- Mouse / touch parallax ---- */
  var targetX = 0, targetY = 2.2;
  var camX = 0, camY = 2.2;
  if (!reduceMotion && !isTouch) {
    window.addEventListener('mousemove', function (e) {
      var nx = e.clientX / window.innerWidth - 0.5;
      var ny = e.clientY / window.innerHeight - 0.5;
      targetX = nx * 2.4;
      targetY = 2.2 + ny * -1.3;
    });
  } else if (!reduceMotion && isTouch) {
    /* Subtle tilt parallax on touch devices (does not block scroll) */
    window.addEventListener('deviceorientation', function (e) {
      if (!e.gamma || !e.beta) return;
      var nx = Math.max(-1, Math.min(1, e.gamma / 45)); // left/right tilt
      var ny = Math.max(-1, Math.min(1, (e.beta - 45) / 45)); // forward/back tilt
      targetX = nx * 1.2;
      targetY = 2.2 + ny * -0.8;
    });
  }

  /* ---- Pause rendering when off-screen ---- */
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible = en.isIntersecting; });
    }, { threshold: 0 }).observe(document.getElementById('templeScroll'));
  }

  /* ---- Overlay readout ---- */
  var idxEl = document.getElementById('templeIndex');
  var nameEl = document.getElementById('templeName');
  var lastIdx = -1;

  /* ---- Animation loop ---- */
  var clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    var t = reduceMotion ? 0 : clock.getElapsedTime();

    var z = THREE.MathUtils.lerp(startZ, endZ, progress.v);
    camX += (targetX - camX) * 0.05;
    camY += (targetY - camY) * 0.05;
    camera.position.set(camX, camY, z);
    camera.lookAt(camX * 0.3, 2.2 + Math.sin(t * 0.2) * 0.1, z - 8);

    cards.forEach(function (g) {
      g.position.y = g.userData.baseY + Math.sin(t * 0.6 + g.userData.phase) * 0.12;
      g.rotation.y = Math.sin(t * 0.25 + g.userData.phase) * 0.22 + camX * 0.05;
    });

    if (!reduceMotion) {
      beams.forEach(function (b) {
        var m = b.userData.mat;
        if (m) m.opacity = b.userData.baseOp + Math.sin(t * 0.7 + b.userData.phase) * 0.12;
        b.rotation.z += 0.0008;
      });
      var pa = dustGeo.attributes.position.array;
      for (var d = 0; d < DUST; d++) {
        pa[d * 3 + 1] += dSpeed[d] * 0.01;
        pa[d * 3 + 0] += Math.sin(t * 0.5 + dPhase[d]) * 0.0015;
        if (pa[d * 3 + 1] > 11) { pa[d * 3 + 1] = 0.5; pa[d * 3 + 0] = (Math.random() * 2 - 1) * 9; }
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    var nearest = 0, best = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var d = Math.abs(cards[i].position.z - z);
      if (d < best) { best = d; nearest = i; }
    }
    if (nearest !== lastIdx) {
      lastIdx = nearest;
      var n = String(nearest + 1).padStart(2, '0');
      if (idxEl) idxEl.textContent = '[' + n + '/04]';
      if (nameEl) {
        nameEl.style.opacity = 0;
        setTimeout(function () { nameEl.textContent = titles[nearest]; nameEl.style.opacity = 1; }, 160);
      }
    }

    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  tick();

  /* ---- Resize ---- */
  window.addEventListener('resize', function () {
    camera.fov = getCameraFov();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('load', function () {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });
})();
