// Decorative space scene behind the game. The globe is faceted and only coarsely
// land/ocean, so it can't reveal the answer (stays a non-hint).
import * as THREE from 'three';
import { isLand as boxIsLand } from './landmask.js';
import { CONSTELLATIONS, raDecToVec3 } from './constellations.js';

const TILT = (23.4 * Math.PI) / 180;
const AUTO_SPIN = 0.04;
const DRAG_SENS = 0.005;
const MASK_URL = '/assets/earth-water.png';
const SKY_R = 55;
const SAT_PERIOD = 10; // seconds per orbit
const SAT_SCALE = 0.5;

const OCEAN = new THREE.Color(0x15394f);
const LAND = new THREE.Color(0x2f6b46);

const STAR_PALETTE = [
  [1.0, 1.0, 1.0], [1.0, 1.0, 1.0], [1.0, 1.0, 1.0], [0.92, 0.95, 1.0],
  [0.74, 0.85, 1.0], [1.0, 0.94, 0.74], [1.0, 0.76, 0.54], [1.0, 0.58, 0.52],
];

function softStarTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.7)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function initGlobe(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0, 0, 4.4);

  const view = new THREE.Group();
  scene.add(view);

  const globe = new THREE.Group();
  globe.rotation.z = TILT;
  view.add(globe);

  const starTex = softStarTexture();

  // ---------- Field stars ----------
  const STAR_COUNT = 840;
  const starPos = new Float32Array(STAR_COUNT * 3);
  const starCol = new Float32Array(STAR_COUNT * 3);
  const starBase = new Float32Array(STAR_COUNT * 3);
  const starLevel = new Float32Array(STAR_COUNT);
  const starPhase = new Float32Array(STAR_COUNT);
  const starSpeed = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    const dist = SKY_R + Math.random() * 18;
    starPos[i * 3] = r * Math.cos(theta) * dist;
    starPos[i * 3 + 1] = u * dist;
    starPos[i * 3 + 2] = r * Math.sin(theta) * dist;
    const p = STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)];
    starBase[i * 3] = p[0]; starBase[i * 3 + 1] = p[1]; starBase[i * 3 + 2] = p[2];
    starLevel[i] = (0.5 + Math.random() * 0.5) * 1.5;
    starPhase[i] = Math.random() * Math.PI * 2;
    starSpeed[i] = 0.6 + Math.random() * 2.2;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 2.8, map: starTex, vertexColors: true, transparent: true,
    depthWrite: false, sizeAttenuation: false, blending: THREE.AdditiveBlending,
  }));
  view.add(stars);

  // ---------- Constellations (real summer sky) ----------
  const cStarPositions = [];
  const cBase = [];
  const cPhase = [];
  const cSpeed = [];
  const linePositions = [];
  for (const constel of CONSTELLATIONS) {
    const verts = constel.stars.map(([ra, dec]) => raDecToVec3(ra, dec, SKY_R - 4));
    for (const v of verts) {
      cStarPositions.push(v[0], v[1], v[2]);
      cBase.push(0.8, 0.86, 1.0);
      cPhase.push(Math.random() * Math.PI * 2);
      cSpeed.push(0.5 + Math.random() * 1.4);
    }
    for (const [i, j] of constel.lines) linePositions.push(...verts[i], ...verts[j]);
  }
  const cCount = cStarPositions.length / 3;
  const cCol = new Float32Array(cCount * 3);
  const cGeo = new THREE.BufferGeometry();
  cGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cStarPositions), 3));
  cGeo.setAttribute('color', new THREE.BufferAttribute(cCol, 3));
  const constelStars = new THREE.Points(cGeo, new THREE.PointsMaterial({
    size: 4.0, map: starTex, vertexColors: true, transparent: true,
    depthWrite: false, sizeAttenuation: false, blending: THREE.AdditiveBlending,
  }));
  view.add(constelStars);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  const constelLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
    color: 0x7d93c4, transparent: true, opacity: 0.22, depthWrite: false,
  }));
  view.add(constelLines);

  // ---------- Low-poly moon ----------
  const moonGeo = new THREE.IcosahedronGeometry(0.306, 1).toNonIndexed();
  const mPos = moonGeo.attributes.position;
  const mColors = new Float32Array(mPos.count * 3);
  const moonBase = new THREE.Color(0x9aa0a8);
  const mc = new THREE.Color();
  for (let i = 0; i < mPos.count; i += 3) {
    const hash = ((Math.sin((i + 7) * 78.233) * 43758.5453) % 1 + 1) % 1;
    mc.copy(moonBase).offsetHSL(0, 0, (hash - 0.65) * 0.12);
    for (let k = 0; k < 3; k++) {
      mColors[(i + k) * 3] = mc.r; mColors[(i + k) * 3 + 1] = mc.g; mColors[(i + k) * 3 + 2] = mc.b;
    }
  }
  moonGeo.setAttribute('color', new THREE.BufferAttribute(mColors, 3));
  const moon = new THREE.Mesh(moonGeo, new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 1.0, metalness: 0.0,
  }));
  moon.position.set(-1.85, 1.0, -0.6);
  view.add(moon);

  // ---------- Satellite orbiting the moon ----------
  const satPivot = new THREE.Group();
  satPivot.position.copy(moon.position);
  satPivot.rotation.x = 0.55; // tilt orbit plane so it reads as an orbit
  view.add(satPivot);

  const satellite = new THREE.Group();
  const satBodyMat = new THREE.MeshStandardMaterial({
    color: 0xbcc6d2, emissive: 0x3aa0c8, emissiveIntensity: 0.15,
    roughness: 0.55, metalness: 0.25, flatShading: true,
  });
  satellite.add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.12), satBodyMat));
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x2a3b56, emissive: 0x14233a, emissiveIntensity: 0.2, roughness: 0.5, metalness: 0.3, flatShading: true,
  });
  const panelGeo = new THREE.BoxGeometry(0.17, 0.006, 0.08);
  const panelL = new THREE.Mesh(panelGeo, panelMat); panelL.position.x = -0.14;
  const panelR = new THREE.Mesh(panelGeo, panelMat); panelR.position.x = 0.14;
  satellite.add(panelL, panelR);
  satellite.position.set(0.62, 0, 0); // orbit radius
  satPivot.add(satellite);

  // ---------- Globe surface (low-poly, per-face land/ocean) ----------
  const radius = 1.53;
  const geometry = new THREE.IcosahedronGeometry(radius, 4).toNonIndexed();
  const pos = geometry.attributes.position;
  const faceColors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    faceColors[i * 3] = OCEAN.r; faceColors[i * 3 + 1] = OCEAN.g; faceColors[i * 3 + 2] = OCEAN.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(faceColors, 3));

  const faceLatLon = [];
  {
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const cen = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i);
      b.fromBufferAttribute(pos, i + 1);
      c.fromBufferAttribute(pos, i + 2);
      cen.copy(a).add(b).add(c).multiplyScalar(1 / 3).normalize();
      const lat = Math.asin(THREE.MathUtils.clamp(cen.y, -1, 1)) * 180 / Math.PI;
      const lon = Math.atan2(cen.z, cen.x) * 180 / Math.PI;
      faceLatLon.push([i, lat, lon]);
    }
  }

  function paintFaces(isWater) {
    const col = new THREE.Color();
    for (const [i, lat, lon] of faceLatLon) {
      col.copy(isWater(lat, lon) ? OCEAN : LAND);
      const hash = ((Math.sin((i + 1) * 12.9898) * 43758.5453) % 1 + 1) % 1;
      col.offsetHSL(0, 0, (hash - 0.5) * 0.05);
      for (let k = 0; k < 3; k++) {
        faceColors[(i + k) * 3] = col.r;
        faceColors[(i + k) * 3 + 1] = col.g;
        faceColors[(i + k) * 3 + 2] = col.b;
      }
    }
    geometry.attributes.color.needsUpdate = true;
  }

  const maskImg = new Image();
  maskImg.onload = () => {
    try {
      const W = 512;
      const H = 256;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(maskImg, 0, 0, W, H);
      const data = cx.getImageData(0, 0, W, H).data;
      const lumAt = (lat, lon) => {
        const x = Math.min(W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * W)));
        const y = Math.min(H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * H)));
        const i = (y * W + x) * 4;
        return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      };
      const oceanRef = lumAt(0, -150);
      const landRef = lumAt(2, 18);
      const mid = (oceanRef + landRef) / 2;
      const waterBright = oceanRef >= landRef;
      paintFaces((lat, lon) => (waterBright ? lumAt(lat, lon) >= mid : lumAt(lat, lon) < mid));
    } catch {
      paintFaces((lat, lon) => !boxIsLand(lat, lon));
    }
  };
  maskImg.onerror = () => paintFaces((lat, lon) => !boxIsLand(lat, lon));
  maskImg.src = MASK_URL;

  const surface = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0.0,
  }));
  globe.add(surface);
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x0a1622, transparent: true, opacity: 0.22 }),
  );
  globe.add(wire);

  const key = new THREE.DirectionalLight(0xdfeefa, 1.45);
  key.position.set(-3, 2, 3);
  scene.add(key);
  scene.add(new THREE.AmbientLight(0x2a3a46, 1.05));

  // ---------- Cursor tracking ----------
  let mouseX = -1e5;
  let mouseY = -1e5;
  window.addEventListener('pointermove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  // ---------- Drag / double-click / satellite click ----------
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let resetting = false;
  let warping = false;
  let satArmed = false;
  let satDownX = 0;
  let satDownY = 0;
  const satScreen = { x: 0, y: 0, near: false };

  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', (e) => {
    if (satScreen.near && !warping) { // clicking the satellite, not dragging the sky
      satArmed = true; satDownX = e.clientX; satDownY = e.clientY;
      return;
    }
    dragging = true;
    resetting = false;
    lastX = e.clientX; lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    view.rotation.y += (e.clientX - lastX) * DRAG_SENS;
    view.rotation.x = THREE.MathUtils.clamp(view.rotation.x + (e.clientY - lastY) * DRAG_SENS, -1.0, 1.0);
    lastX = e.clientX; lastY = e.clientY;
  });
  const endDrag = (e) => {
    if (satArmed) {
      satArmed = false;
      const moved = Math.hypot(e.clientX - satDownX, e.clientY - satDownY);
      if (moved < 8 && satScreen.near && !warping) {
        warping = true;
        opts.onWarp?.(satScreen.x, satScreen.y);
      }
      return;
    }
    dragging = false;
    canvas.style.cursor = satScreen.near ? 'pointer' : 'grab';
    if (e.pointerId !== undefined && canvas.hasPointerCapture?.(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('dblclick', () => { if (!satScreen.near) resetting = true; });

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    globe.position.x = w > 720 ? 0.65 : 0;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let running = true;
  let satGlow = 0;
  const satWorld = new THREE.Vector3();

  function twinkle(geo, colArr, base, level, phase, speed, count) {
    for (let i = 0; i < count; i++) {
      const tw = reduceMotion ? 1 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * speed[i] + phase[i]));
      const b = level[i] * tw;
      colArr[i * 3] = base[i * 3] * b;
      colArr[i * 3 + 1] = base[i * 3 + 1] * b;
      colArr[i * 3 + 2] = base[i * 3 + 2] * b;
    }
    geo.attributes.color.needsUpdate = true;
  }
  const cLevel = new Float32Array(cCount).fill(1);
  const cPhaseArr = Float32Array.from(cPhase);
  const cSpeedArr = Float32Array.from(cSpeed);
  const cBaseArr = Float32Array.from(cBase);

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    elapsed += dt;
    if (!dragging && !reduceMotion) globe.rotation.y += AUTO_SPIN * dt;
    if (resetting) {
      view.rotation.x += (0 - view.rotation.x) * Math.min(1, dt * 6);
      view.rotation.y += (0 - view.rotation.y) * Math.min(1, dt * 6);
      if (Math.abs(view.rotation.x) < 0.002 && Math.abs(view.rotation.y) < 0.002) {
        view.rotation.set(0, 0, 0);
        resetting = false;
      }
    }
    if (!reduceMotion) {
      moon.rotation.y += 0.02 * dt;
      satPivot.rotation.y += (Math.PI * 2 / SAT_PERIOD) * dt;
      satellite.rotation.y += 0.6 * dt;
    }

    twinkle(starGeo, starCol, starBase, starLevel, starPhase, starSpeed, STAR_COUNT);
    twinkle(cGeo, cCol, cBaseArr, cLevel, cPhaseArr, cSpeedArr, cCount);

    // Satellite hover: project to screen, glow + pulse when cursor is near.
    satellite.getWorldPosition(satWorld);
    const ndc = satWorld.clone().project(camera);
    const W = canvas.clientWidth || window.innerWidth;
    const H = canvas.clientHeight || window.innerHeight;
    satScreen.x = (ndc.x * 0.5 + 0.5) * W;
    satScreen.y = (-ndc.y * 0.5 + 0.5) * H;
    const d = Math.hypot(mouseX - satScreen.x, mouseY - satScreen.y);
    satScreen.near = ndc.z < 1 && d < 64;
    satGlow += ((satScreen.near ? 1 : 0) - satGlow) * Math.min(1, dt * 8);
    const pulse = 0.55 + 0.45 * Math.sin(elapsed * 6);
    satBodyMat.emissiveIntensity = 0.15 + satGlow * 1.6 * pulse;
    satellite.scale.setScalar(SAT_SCALE * (1 + satGlow * 0.22 * pulse));
    if (!dragging && !warping) canvas.style.cursor = satScreen.near ? 'pointer' : 'grab';

    renderer.render(scene, camera);
    if (running) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function onVisibility() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  document.addEventListener('visibilitychange', onVisibility);

  return {
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      surface.material.dispose();
      wire.geometry.dispose();
      wire.material.dispose();
      starGeo.dispose();
      stars.material.dispose();
      cGeo.dispose();
      constelStars.material.dispose();
      lineGeo.dispose();
      constelLines.material.dispose();
      moonGeo.dispose();
      moon.material.dispose();
      satellite.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
      starTex.dispose();
      renderer.dispose();
    },
  };
}
