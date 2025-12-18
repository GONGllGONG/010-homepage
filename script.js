// ===== Helpers =====
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;

function getProgress() {
  const vh = window.innerHeight || 1;
  return clamp01(window.scrollY / vh);
}

// ===== Canvas =====
const canvas = document.getElementById("orbit");
const ctx = canvas.getContext("2d", { alpha: true });

let w = 0, h = 0, baseCX = 0, baseCY = 0;
let timeSec = 0;

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  w = Math.floor(window.innerWidth);
  h = Math.floor(window.innerHeight);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  baseCX = w / 2;
  baseCY = h / 2;
}
window.addEventListener("resize", resize);
resize();

// ===== Orbit templates (max pool) =====
const orbitTemplates = [
  { sy: 1.00, rot: 0.00, speed: 0.00065 }, // 첫 화면: 아주 느리게
  { sy: 0.78, rot: 0.35, speed: 0.00055 },
  { sy: 0.92, rot: -0.55, speed: 0.00048 },
  { sy: 0.64, rot: 0.95, speed: 0.00042 },
  { sy: 0.86, rot: -1.12, speed: 0.00038 },
  { sy: 0.70, rot: 1.35, speed: 0.00034 },
  { sy: 0.96, rot: -0.15, speed: 0.00036 },
];

function orbitRadius(i) {
  const p = getProgress();
  const base = Math.min(w, h) * (0.16 + p * 0.03);
  const step = Math.min(w, h) * 0.055;
  return base + i * step;
}

function orbitPoint(angle, r, sy, rot, cx, cy) {
  const ox = Math.cos(angle) * r;
  const oy = Math.sin(angle) * r * sy;

  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  const rx = ox * cosR - oy * sinR;
  const ry = ox * sinR + oy * cosR;

  return { x: cx + rx, y: cy + ry };
}

// ===== Growth rules =====
function orbitCountFromScroll(progress) {
  return 1 + (5 - 1) * progress; // 1 -> 5
}
function electronsPerOrbitFromScroll(progress) {
  return 1 + (3 - 1) * progress; // 1 -> 3
}

// ===== Click-driven boost =====
let clickBoost = 0;
const maxClickBoost = 7;

// 새 궤도 “탄생 시간” 기록 (그려지며 생성용)
const bornAt = new Array(orbitTemplates.length).fill(null);

// 클릭 판정용: 첫 번째 전자 좌표
let primaryElectron = { x: 0, y: 0, hitR: 30 };

// ===== Effects: sparks + shockwaves =====
const sparks = [];
const waves = [];

function spawnBurst(x, y, power = 1) {
  const count = Math.floor(18 + power * 18);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = (1.2 + Math.random() * 2.8) * power;
    sparks.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 1,
      r: 1.2 + Math.random() * 1.8,
    });
  }
}

function spawnWave(x, y) {
  waves.push({ x, y, r: 0, life: 1 });
}

function updateDrawWaves() {
  for (let i = waves.length - 1; i >= 0; i--) {
    const wv = waves[i];
    wv.life -= 0.025;
    wv.r += 18;

    if (wv.life <= 0) { waves.splice(i, 1); continue; }

    const a = Math.max(0, wv.life);

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(255,106,0,${0.22 * a})`;
    ctx.beginPath();
    ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255,255,255,${0.08 * a})`;
    ctx.beginPath();
    ctx.arc(wv.x, wv.y, wv.r * 0.65, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function updateDrawSparks() {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.life -= 0.03;
    if (p.life <= 0) { sparks.splice(i, 1); continue; }

    p.vx *= 0.98;
    p.vy *= 0.98;
    p.vy += 0.01;

    p.x += p.vx;
    p.y += p.vy;

    const alpha = Math.max(0, p.life);

    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
    g.addColorStop(0, `rgba(255,106,0,${0.22 * alpha})`);
    g.addColorStop(1, "rgba(255,106,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255,106,0,${0.85 * alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== Drawing primitives =====
function drawOrbitPath(r, sy, rot, cx, cy, alpha, trace = 1) {
  // trace: 0~1 (그려지며 생성)
  const end = Math.PI * 2 * trace;

  ctx.beginPath();
  for (let a = 0; a <= end + 0.02; a += 0.06) {
    const p = orbitPoint(a, r, sy, rot, cx, cy);
    if (a === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = `rgba(255,255,255,${0.05 * alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawElectron(x, y, alpha, breathe) {
  const glowR = 18 + 6 * breathe;
  const g = ctx.createRadialGradient(x, y, 0, x, y, glowR);
  g.addColorStop(0, `rgba(255,106,0,${(0.18 + 0.25 * breathe) * alpha})`);
  g.addColorStop(1, "rgba(255,106,0,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255,106,0,${0.9 * alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

// ===== Copy (3) click-driven micro-change =====
const slab = document.getElementById("slabLine");
const slabVariants = [
  "GongllGong",
  "GongllGong — undefined",
  "GongllGong — do not name",
  "GongllGong",
];

function setSlabByClicks(n) {
  if (!slab) return;
  // 1,3,5 클릭에서만 ‘살짝’ 변한다
  let idx = 0;
  if (n >= 5) idx = 3;
  else if (n >= 3) idx = 2;
  else if (n >= 1) idx = 1;

  slab.textContent = slabVariants[idx];
}

// ===== Click handling =====
canvas.addEventListener("pointerdown", (ev) => {
  // “유일한 인터랙션”을 1화면 중심으로 유지하되,
  // 너무 민감하면 0.55까지 허용(살짝 스크롤해도 클릭되게)
  if (getProgress() > 0.55) return;

  const rect = canvas.getBoundingClientRect();
  const mx = ev.clientX - rect.left;
  const my = ev.clientY - rect.top;

  const dx = mx - primaryElectron.x;
  const dy = my - primaryElectron.y;
  const dist = Math.hypot(dx, dy);

  if (dist <= primaryElectron.hitR) {
    // (1) 퐈앙 + (1) 충격파
    spawnBurst(primaryElectron.x, primaryElectron.y, 1.25);
    spawnWave(primaryElectron.x, primaryElectron.y);

    // boost 증가
    const before = clickBoost;
    clickBoost = Math.min(maxClickBoost, clickBoost + 1);

    // (2) 새 궤도 “탄생” 애니메이션 시작
    // boost 1이면 2번째 궤도(i=1)가 태어남… 이런 방식
    const newOrbitIndex = Math.min(orbitTemplates.length - 1, 1 + before);
    if (bornAt[newOrbitIndex] == null) {
      bornAt[newOrbitIndex] = timeSec; // 지금부터 그려지며 등장
    }

    // (3) 문장 미세 변화
    setSlabByClicks(clickBoost);
  }
}, { passive: true });

// ===== Render loop =====
let last = performance.now();

function draw(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  timeSec += dt;

  const progress = getProgress();

  // (B) 중심 “호흡 이동”
  const driftAmp = 3 + 5 * progress;
  const cx = baseCX + Math.sin(timeSec * 0.35) * driftAmp;
  const cy = baseCY + Math.cos(timeSec * 0.28) * driftAmp;

  ctx.clearRect(0, 0, w, h);

  // 중심 광
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
  bg.addColorStop(0, `rgba(255,106,0,${0.03 + 0.03 * progress})`);
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 기본(스크롤) + 클릭(추가)
  const orbitCountF = orbitCountFromScroll(progress) + clickBoost * 0.9;
  const ePerOrbitF = electronsPerOrbitFromScroll(progress) + clickBoost * 0.25;

  const orbitCountI = Math.floor(orbitCountF);
  const orbitFrac = orbitCountF - orbitCountI;

  const ePerOrbitI = Math.floor(ePerOrbitF);
  const eFrac = ePerOrbitF - ePerOrbitI;

  const breathe = 0.5 + 0.5 * Math.sin(timeSec * 0.8);

  const maxToDraw = Math.min(
    orbitTemplates.length,
    orbitCountI + (orbitFrac > 0 ? 1 : 0)
  );

  for (let i = 0; i < maxToDraw; i++) {
    const tpl = orbitTemplates[i];
    const r = orbitRadius(i);

    // orbit alpha
    const alpha = (i < orbitCountI) ? 1 : orbitFrac;

    // (2) 그려지며 생성: bornAt이 있으면 trace/alpha를 잠깐 ‘태어나는’ 느낌으로
    let trace = 1;
    let birthAlpha = 1;

    if (bornAt[i] != null) {
      const age = (timeSec - bornAt[i]);
      const p = clamp01(age / 1.2);      // 1.2초 동안 생성
      trace = p;
      birthAlpha = lerp(0.35, 1, p);
    }

    drawOrbitPath(r, tpl.sy, tpl.rot, cx, cy, alpha * birthAlpha, trace);

    // electrons per orbit
    const eCountF = ePerOrbitI + (eFrac > 0 ? 1 : 0);

    for (let k = 0; k < eCountF; k++) {
      const eAlpha = (k < ePerOrbitI) ? 1 : eFrac;

      const phase = (Math.PI * 2 * k) / Math.max(1, eCountF);
      const a = timeSec * (tpl.speed * 60) + i * 1.9 + phase;

      const p = orbitPoint(a, r, tpl.sy, tpl.rot, cx, cy);
      drawElectron(p.x, p.y, alpha * birthAlpha * eAlpha, breathe);

      // 첫 번째 궤도의 첫 번째 전자 = 클릭 타겟
      if (i === 0 && k === 0) {
        primaryElectron.x = p.x;
        primaryElectron.y = p.y;
        primaryElectron.hitR = 32; // 누르기 쉽게
      }
    }
  }

  // (1) 충격파 + 파티클
  updateDrawWaves();
  updateDrawSparks();

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

// ===== Screen 2 reveal (기존 유지) =====
const reveals = document.querySelectorAll(".reveal");
if (reveals.length) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-on")),
    { threshold: 0.35 }
  );
  reveals.forEach((el) => io.observe(el));
}
