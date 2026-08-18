/* ========== MINT / DROP — MARBLE STATUE REVEAL ==========
   Three.js (r128 UMD global). A dark sanctum: a deity card stands
   on a pedestal. Scroll drives a dramatic camera orbit while
   volumetric light beams sweep across, gradually unveiling the
   statue from silhouette to fully lit. Gold dust, bloom, floor
   reflection. Honors prefers-reduced-motion. */
(function () {
  var canvas = document.getElementById('mint-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  var isMobile = isTouch || window.innerWidth < 768;
  var dprCap = isMobile ? 1.5 : 2;

  /* ---- Renderer ---- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.physicallyCorrectLights = true;

  /* ---- Scene + camera ---- */
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.FogExp2(0x05070a, 0.04);

  function getFov() {
    var a = window.innerWidth / window.innerHeight;
    if (a < 0.6) return 62;
    if (a < 0.9) return 54;
    return 45;
  }
  var camera = new THREE.PerspectiveCamera(getFov(), window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 0.8, 13);

  /* ---- Environment map ---- */
  (function makeEnv() {
    var c = document.createElement('canvas'); c.width = 512; c.height = 256;
    var ctx = c.getContext('2d');
    var g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.00, '#080c12');
    g.addColorStop(0.50, '#12181f');
    g.addColorStop(0.68, '#2a2012');
    g.addColorStop(1.00, '#05070a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256);
    var tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.encoding = THREE.sRGBEncoding;
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromEquirectangular(tex).texture;
  })();

  /* ---- Dim ambient ---- */
  scene.add(new THREE.AmbientLight(0x0a0e14, 0.5));
  scene.add(new THREE.HemisphereLight(0x161c24, 0x04060a, 0.25));

  /* ---- Floor (reflective marble) + back wall ---- */
  var floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0d12, metalness: 0.75, roughness: 0.28, envMapIntensity: 0.8 });
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -5.8, 0);
  scene.add(floor);

  var wallMat = new THREE.MeshStandardMaterial({ color: 0x080b10, metalness: 0.2, roughness: 0.9, envMapIntensity: 0.3 });
  var wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), wallMat);
  wall.position.set(0, 0, -7);
  scene.add(wall);

  /* ---- Pedestal ---- */
  var pedMat = new THREE.MeshStandardMaterial({ color: 0x0c1016, metalness: 0.5, roughness: 0.55, envMapIntensity: 0.7 });
  var pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.5, 2.0, 48), pedMat);
  pedestal.position.set(0, -4.8, -1.5);
  scene.add(pedestal);

  var pedRimMat = new THREE.MeshStandardMaterial({ color: 0xd8b671, metalness: 1.0, roughness: 0.25, emissive: 0x140d05, emissiveIntensity: 0.15, envMapIntensity: 1.3 });
  var pedRim = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.2, 48), pedRimMat);
  pedRim.position.set(0, -3.8, -1.5);
  scene.add(pedRim);

  /* ---- Deity statue card ---- */
  var statue = new THREE.Group();
  statue.position.set(0, 0.5, -1.5);
  var cardScale = isMobile ? 0.95 : 0.82;
  statue.scale.set(cardScale, cardScale, cardScale);
  scene.add(statue);

  var goldMat = new THREE.MeshStandardMaterial({
    color: 0xd8b671, metalness: 1.0, roughness: 0.22,
    emissive: 0x0c0703, emissiveIntensity: 0.06, envMapIntensity: 1.4
  });
  var frame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 5.0, 0.14), goldMat);
  statue.add(frame);

  var loader = new THREE.TextureLoader();
  var deityTex = loader.load('images/ChatGPT Image Jul 16, 2026, 02_37_54 PM.png');
  deityTex.encoding = THREE.sRGBEncoding;
  var imgMat = new THREE.MeshStandardMaterial({
    map: deityTex, emissiveMap: deityTex, emissive: 0xffffff, emissiveIntensity: 0.0,
    metalness: 0.2, roughness: 0.6, envMapIntensity: 0.5
  });
  var img = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.6), imgMat);
  img.position.z = 0.08;
  statue.add(img);

  var backMat = new THREE.MeshStandardMaterial({ color: 0x06090c, metalness: 0.6, roughness: 0.5, envMapIntensity: 0.5 });
  var back = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.6), backMat);
  back.position.z = -0.08;
  back.rotation.y = Math.PI;
  statue.add(back);

  /* ---- Volumetric light beam texture ---- */
  var beamTex = (function () {
    var c = document.createElement('canvas'); c.width = 64; c.height = 256;
    var ctx = c.getContext('2d');
    var vg = ctx.createLinearGradient(0, 0, 0, 256);
    vg.addColorStop(0.00, 'rgba(255,232,180,0.0)');
    vg.addColorStop(0.08, 'rgba(255,232,180,0.95)');
    vg.addColorStop(0.40, 'rgba(216,182,113,0.4)');
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

  /* ---- 5 sweeping light beams (volumetric god-rays) ---- */
  var beams = [];
  var beamConfigs = [
    { z: 2, color: 0xffe0a0, side: -1 },
    { z: 0, color: 0xbfe0e8, side: 1 },
    { z: -2, color: 0xffc878, side: -1 },
    { z: -4, color: 0xffd9a0, side: 1 },
    { z: -6, color: 0xc8dce4, side: -1 }
  ];
  beamConfigs.forEach(function (cfg, i) {
    var grp = new THREE.Group();
    var bm = new THREE.MeshBasicMaterial({
      map: beamTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    var p1 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 16), bm);
    var p2 = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 16), bm);
    p2.rotation.y = Math.PI / 2;
    grp.add(p1); grp.add(p2);
    grp.position.set(cfg.side * 2.2, 6, cfg.z);
    grp.rotation.z = cfg.side * 0.25;
    grp.userData = { mat: bm, baseOp: 0.55, side: cfg.side, z: cfg.z, phase: i * 1.3, color: cfg.color };
    scene.add(grp);
    beams.push(grp);
  });

  /* ---- Spotlights (actual illumination) ---- */
  var spots = [];
  var spotColors = [0xffe0a0, 0xbfe0e8, 0xffc878];
  for (var s = 0; s < 3; s++) {
    var spot = new THREE.SpotLight(spotColors[s], 0, 28, Math.PI / 6, 0.5, 1.4);
    spot.position.set(0, 8, 4);
    spot.target.position.set(0, 0, -1.5);
    scene.add(spot); scene.add(spot.target);
    spots.push({ light: spot, index: s });
  }

  /* warm fill that lifts with reveal */
  var fill = new THREE.PointLight(0xffcc88, 0, 26, 1.8);
  fill.position.set(0, 1.5, 5);
  scene.add(fill);

  /* ---- Halo glow behind the card ---- */
  var glowTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.00, 'rgba(255,220,150,1)');
    g.addColorStop(0.20, 'rgba(255,190,90,0.5)');
    g.addColorStop(0.55, 'rgba(216,150,70,0.1)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  var halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, blending: THREE.AdditiveBlending, transparent: true,
    depthWrite: false, opacity: 0
  }));
  halo.scale.set(8, 8, 1);
  halo.position.set(0, 0.5, -2.5);
  scene.add(halo);

  /* ---- Gold dust motes ---- */
  var dustTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 32;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0.00, 'rgba(255,236,180,1)');
    g.addColorStop(0.40, 'rgba(216,182,113,0.5)');
    g.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  })();
  var DUST = isMobile ? 200 : 420;
  var dPos = new Float32Array(DUST * 3);
  var dPhase = new Float32Array(DUST);
  var dSpeed = new Float32Array(DUST);
  for (var d = 0; d < DUST; d++) {
    dPos[d * 3 + 0] = (Math.random() * 2 - 1) * 10;
    dPos[d * 3 + 1] = (Math.random() * 2 - 1) * 10;
    dPos[d * 3 + 2] = (Math.random() * 2 - 1) * 6 - 2;
    dPhase[d] = Math.random() * Math.PI * 2;
    dSpeed[d] = 0.08 + Math.random() * 0.18;
  }
  var dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  var dustMat = new THREE.PointsMaterial({
    size: 0.13, map: dustTex, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending,
    sizeAttenuation: true, color: 0xffd9a0
  });
  var dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* ---- Bloom ---- */
  var composer = null;
  var bloomPass = null;
  if (typeof THREE.EffectComposer !== 'undefined') {
    composer = new THREE.EffectComposer(renderer);
    composer.addPass(new THREE.RenderPass(scene, camera));
    var bloomRes = isMobile ? 0.6 : 1.0;
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth * bloomRes, window.innerHeight * bloomRes), 0.55, 0.5, 0.7
    );
    composer.addPass(bloomPass);
    if (typeof THREE.GammaCorrectionShader !== 'undefined') {
      composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
    }
  }

  /* ---- Scroll progress ---- */
  var progress = { v: 0 };
  var section = document.getElementById('mintSection');
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.to(progress, {
      v: 1, ease: 'none',
      scrollTrigger: {
        trigger: '#mintSection',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.0
      }
    });
  } else {
    progress.v = 1;
  }

  /* ---- Mouse parallax ---- */
  var targetX = 0, targetY = 0.8, camX = 0, camY = 0.8;
  if (!reduceMotion && !isTouch) {
    window.addEventListener('mousemove', function (e) {
      targetX = (e.clientX / window.innerWidth - 0.5) * 1.8;
      targetY = 0.8 + (e.clientY / window.innerHeight - 0.5) * -1.0;
    });
  }

  /* ---- Pause when off-screen ---- */
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible = en.isIntersecting; });
    }, { threshold: 0 }).observe(section);
  }

  function smooth(t) { return t * t * (3 - 2 * t); }

  /* ---- Reveal mint UI ---- */
  var revealedUI = false;
  function updateUI(p) {
    if (p > 0.72 && !revealedUI && section) {
      revealedUI = true;
      section.classList.add('is-revealed');
    } else if (p <= 0.66 && revealedUI && section) {
      revealedUI = false;
      section.classList.remove('is-revealed');
    }
  }
  if (reduceMotion) updateUI(1);

  /* ---- Animation loop ---- */
  var clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    var t = reduceMotion ? 0 : clock.getElapsedTime();
    var p = progress.v;
    var sp = smooth(p);

    /* DRAMATIC camera orbit: wide sweep from left to right */
    var orbitAngle = THREE.MathUtils.lerp(-0.85, 0.65, sp);
    var orbitRadius = THREE.MathUtils.lerp(16, 10, sp);
    var orbitHeight = THREE.MathUtils.lerp(2.5, 0.5, sp);
    camX += (targetX - camX) * 0.05;
    camY += (targetY - camY) * 0.05;
    camera.position.set(Math.sin(orbitAngle) * orbitRadius + camX, orbitHeight + camY, Math.cos(orbitAngle) * orbitRadius);
    camera.lookAt(0, 0.5, -1.5);

    /* statue idle + follows camera slightly */
    statue.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.22) * 0.05 - orbitAngle * 0.3;
    statue.position.y = 0.5 + (reduceMotion ? 0 : Math.sin(t * 0.5) * 0.06);

    /* sweeping spotlights ramp on in sequence */
    spots.forEach(function (sp_obj, i) {
      var band = (p - i * 0.15) / 0.45;
      var on = Math.max(0, Math.min(1, band));
      sp_obj.light.intensity = on * 20;
      var a = (i - 1) * 0.8 + sp * 0.6;
      sp_obj.light.position.set(Math.sin(a) * 8, 8, Math.cos(a) * 5 + 3);
    });

    /* fill light */
    fill.intensity = sp * 7;

    /* card wakes from dark silhouette to fully lit */
    imgMat.emissiveIntensity = sp * 0.35;
    goldMat.emissiveIntensity = 0.06 + sp * 0.6;
    pedRimMat.emissiveIntensity = 0.15 + sp * 0.6;

    /* halo grows with reveal */
    halo.material.opacity = sp * 0.8;
    var haloS = 8 + sp * 5 + (reduceMotion ? 0 : Math.sin(t * 0.8) * 0.5);
    halo.scale.set(haloS, haloS, 1);

    /* volumetric beams sweep and pulse */
    beams.forEach(function (b) {
      var m = b.userData.mat;
      var beamOn = smooth(Math.max(0, Math.min(1, (p - 0.05) / 0.9)));
      m.opacity = b.userData.baseOp * beamOn + (reduceMotion ? 0 : Math.sin(t * 0.6 + b.userData.phase) * 0.1);
      b.rotation.z = b.userData.side * 0.25 + Math.sin(t * 0.3 + b.userData.phase) * 0.08;
      b.rotation.y += 0.003;
      b.position.x = b.userData.side * (2.2 + Math.sin(t * 0.25 + b.userData.phase) * 0.8);
    });

    /* dust — more visible, drifts with the light */
    dustMat.opacity = sp * 0.85;
    if (!reduceMotion) {
      var pa = dustGeo.attributes.position.array;
      for (var i = 0; i < DUST; i++) {
        pa[i * 3 + 1] += dSpeed[i] * 0.007 * (0.3 + sp);
        pa[i * 3 + 0] += Math.sin(t * 0.4 + dPhase[i]) * 0.0012;
        if (pa[i * 3 + 1] > 10) { pa[i * 3 + 1] = -10; pa[i * 3 + 0] = (Math.random() * 2 - 1) * 10; }
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    /* bloom swells */
    if (bloomPass) bloomPass.strength = 0.5 + sp * 0.8;

    /* toggle mint UI */
    updateUI(p);

    if (composer) composer.render(); else renderer.render(scene, camera);
  }
  tick();

  /* ---- Resize ---- */
  window.addEventListener('resize', function () {
    camera.fov = getFov();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (composer) composer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('load', function () {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  });

  /* ---- Mint button feedback ---- */
  var mintBtn = document.getElementById('mintBtn');
  if (mintBtn) {
    mintBtn.addEventListener('click', function () {
      var span = mintBtn.querySelector('span');
      var original = span.textContent;
      mintBtn.disabled = true;
      span.textContent = 'CONNECTING…';
      setTimeout(function () {
        span.textContent = 'WALLET NEEDED';
        setTimeout(function () {
          span.textContent = original;
          mintBtn.disabled = false;
        }, 1800);
      }, 1600);
    });
  }
})();
