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
let t = 0;

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
  { sy: 1.00, rot: 0.00, speed: 0.0014 },  // 1st: 원형에 가깝게
  { sy: 0.78, rot: 0.35, speed: 0.0012 },
  { sy: 0.92, rot: -0.55, speed: 0.0010 },
  { sy: 0.64, rot: 0.95, speed: 0.0009 },
  { sy: 0.86, rot: -1.12, speed: 0.0008 },
  { sy: 0.70, rot: 1.35, speed: 0.00075 },
  { sy: 0.96, rot: -0.15, speed: 0.00085 },
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

function drawOrbitPath(r, sy, rot, cx, cy, alpha) {
  ctx.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.02; a += 0.06) {
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

// ===== Scroll-driven base growth =====
function getOrbitCountFromScroll(progress) {
  const min = 1;
  const max = 5;
  return min + (max - min) * progress; // fractional
}

function getElectronsPerOrbitFromScroll(progress) {
  const min = 1;
  const max = 3;
  return min + (max - min) * progress; // fractional
}

// ===== Click-driven extra growth (THIS IS YOUR IDEA) =====
let clickBoost = 0; // 클릭할 때마다 궤도/전자 추가 “권한”
const maxClickBoost = 6; // 너무 과해지지 않게 제한

// “퐈앙” 파티클
const sparks = [];
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

function updateAndDrawSparks() {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.life -= 0.03;
    if (p.life <= 0) { sparks.splice(i, 1); continue; }

    p.vx *= 0.98;
    p.vy *= 0.98;
    p.vy += 0.01; // 아주 약한 낙하

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

// 클릭 판정용: "지금 보이는 첫 번째 전자" 좌표 기록
let primaryElectron = { x: 0, y: 0, hitR: 26 };

// 캔버스 클릭 이벤트
canvas.addEventListener("pointerdown", (ev) => {
  // 첫 화면(혹은 거의 첫 화면)에서만 “유일한 인터랙션”으로 강하게 유지
  if (getProgress() > 0.35) return;

  const rect = canvas.getBoundingClientRect();
  const mx = ev.clientX - rect.left;
  const my = ev.clientY - rect.top;

  const dx = mx - primaryElectron.x;
  const dy = my - primaryElectron.y;
  const dist = Math.hypot(dx, dy);

  if (dist <= primaryElectron.hitR) {
    // 퐈앙!
    spawnBurst(primaryElectron.x, primaryElectron.y, 1.2);

    // 궤도/전자 “추가”
    clickBoost = Math.min(maxClickBoost, clickBoost + 1);

    // (선택) 클릭할 때 아주 미세한 화면 흔들림 느낌을 주고 싶으면 여기서 구현 가능
  } else {
    // 전자를 정확히 누르지 않아도 “근처”면 약하게 반응시키고 싶다면:
    // (지금은 공일공답게: 정확히 눌러야 터지게 유지)
  }
}, { passive: true });

// ===== Render loop =====
function draw() {
  t += 0.016;
  const progress = getProgress();

  // 중심 “호흡 이동” (B)
  const driftAmp = 3 + 5 * progress;
  const cx = baseCX + Math.sin(t * 0.35) * driftAmp;
  const cy = baseCY + Math.cos(t * 0.28) * driftAmp;

  ctx.clearRect(0, 0, w, h);

  // 중심 광
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
  bg.addColorStop(0, `rgba(255,106,0,${0.03 + 0.03 * progress})`);
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // 스크롤 기본 증가 + 클릭 증가 합치기
  const orbitCountScroll = getOrbitCountFromScroll(progress);
  const ePerOrbitScroll = getElectronsPerOrbitFromScroll(progress);

  // 클릭하면 “정수 단위”로 궤도가 더 늘어나는 느낌
  const orbitCountF = orbitCountScroll + clickBoost * 0.9;
  const ePerOrbitF = ePerOrbitScroll + clickBoost * 0.25;

  const orbitCountI = Math.floor(orbitCountF);
  const orbitFrac = orbitCountF - orbitCountI;

  const ePerOrbitI = Math.floor(ePerOrbitF);
  const eFrac = ePerOrbitF - ePerOrbitI;

  const breathe = 0.5 + 0.5 * Math.sin(t * 0.8);

  const maxToDraw = Math.min(
    orbitTemplates.length,
    orbitCountI + (orbitFrac > 0 ? 1 : 0)
  );

  for (let i = 0; i < maxToDraw; i++) {
    const tpl = orbitTemplates[i];
    const r = orbitRadius(i);

    const alpha = (i < orbitCountI) ? 1 : orbitFrac;

    drawOrbitPath(r, tpl.sy, tpl.rot, cx, cy, alpha);

    const eCountF = ePerOrbitI + (eFrac > 0 ? 1 : 0);

    for (let k = 0; k < eCountF; k++) {
      const eAlpha = (k < ePerOrbitI) ? 1 : eFrac;

      const phase = (Math.PI * 2 * k) / Math.max(1, eCountF);
      const a = t * (tpl.speed * 60) + i * 1.9 + phase;

      const p = orbitPoint(a, r, tpl.sy, tpl.rot, cx, cy);
      drawElectron(p.x, p.y, alpha * eAlpha, breathe);

      // 첫 번째 궤도의 "첫 번째 전자"를 클릭 타겟으로 지정
      if (i === 0 && k === 0) {
        primaryElectron.x = p.x;
        primaryElectron.y = p.y;
        primaryElectron.hitR = 26; // 누르기 쉬운 판정
      }
    }
  }

  // 퐈앙 파티클
  updateAndDrawSparks();

  requestAnimationFrame(draw);
}
draw();

// ===== Screen 2 reveal (기존 유지) =====
const reveals = document.querySelectorAll(".reveal");
if (reveals.length) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-on")),
    { threshold: 0.35 }
  );
  reveals.forEach((el) => io.observe(el));
}
