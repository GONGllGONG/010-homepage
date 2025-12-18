// ===== Helpers =====
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function getProgress() {
  // 첫 화면(0) -> 두 번째 화면(1)로 갈수록 증가
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

// 여러 궤도 템플릿(최대치)
// (첫 화면에서는 0번째만 사용 = 원형에 가깝게)
const orbitTemplates = [
  { sy: 1.00, rot: 0.00, speed: 0.0014 },  // 1st: 가장 조용
  { sy: 0.78, rot: 0.35, speed: 0.0012 },
  { sy: 0.92, rot: -0.55, speed: 0.0010 },
  { sy: 0.64, rot: 0.95, speed: 0.0009 },
  { sy: 0.86, rot: -1.12, speed: 0.0008 },
  { sy: 0.70, rot: 1.35, speed: 0.00075 },
];

function orbitRadius(i) {
  // 스크롤이 늘수록 전체 반경이 아주 조금만 커지게
  const p = getProgress();
  const base = Math.min(w, h) * (0.16 + p * 0.03); // 1st orbit radius
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

// ===== Scroll-driven growth rules =====
function getOrbitCount(progress) {
  // 0일 때 1개, 1일 때 5개(원하면 숫자 바꾸면 됨)
  const min = 1;
  const max = 5;
  return min + (max - min) * progress; // fractional allowed
}

function getElectronsPerOrbit(progress) {
  // 0일 때 1개, 1일 때 3개
  const min = 1;
  const max = 3;
  return min + (max - min) * progress; // fractional allowed
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
  // 주황 “숨쉬기” + 스크롤로 조금 더 살아나는 정도
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

function draw() {
  t += 0.016;
  const progress = getProgress();

  // 중심 “호흡 이동” (B) : 아주 미세하게만
  const driftAmp = 3 + 5 * progress;     // 스크롤할수록 미세하게 커짐
  const cx = baseCX + Math.sin(t * 0.35) * driftAmp;
  const cy = baseCY + Math.cos(t * 0.28) * driftAmp;

  ctx.clearRect(0, 0, w, h);

  // 아주 약한 중심 광 (스크롤할수록 살짝)
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.6);
  bg.addColorStop(0, `rgba(255,106,0,${0.03 + 0.03 * progress})`);
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // “얼마나 늘어났는지” (fractional)
  const orbitCountF = getOrbitCount(progress);
  const orbitCountI = Math.floor(orbitCountF);
  const orbitFrac = orbitCountF - orbitCountI;

  const ePerOrbitF = getElectronsPerOrbit(progress);
  const ePerOrbitI = Math.floor(ePerOrbitF);
  const eFrac = ePerOrbitF - ePerOrbitI;

  // 전자 ‘숨쉬기’
  const breathe = 0.5 + 0.5 * Math.sin(t * 0.8);

  // 실제로 그릴 궤도 수: 정수 + 다음 궤도(부분)
  const maxToDraw = Math.min(orbitTemplates.length, orbitCountI + (orbitFrac > 0 ? 1 : 0));

  for (let i = 0; i < maxToDraw; i++) {
    const tpl = orbitTemplates[i];
    const r = orbitRadius(i);

    // 첫 화면은 “원형 1개 + 전자 1개”가 확실히 보이게:
    // progress 0일 때 i=0만 그려지고 나머진 alpha=0
    const alpha = (i < orbitCountI) ? 1 : orbitFrac;

    // 궤도 라인
    drawOrbitPath(r, tpl.sy, tpl.rot, cx, cy, alpha);

    // 전자 개수 (fractional)
    const eCountF = ePerOrbitI + (eFrac > 0 ? 1 : 0);
    for (let k = 0; k < eCountF; k++) {
      // 마지막 전자는 부분 페이드
      const eAlpha = (k < ePerOrbitI) ? 1 : eFrac;

      // 각 전자의 위상을 다르게
      const phase = (Math.PI * 2 * k) / Math.max(1, eCountF);
      const a = t * (tpl.speed * 60) + i * 1.9 + phase;

      const p = orbitPoint(a, r, tpl.sy, tpl.rot, cx, cy);
      drawElectron(p.x, p.y, alpha * eAlpha, breathe);
    }
  }

  requestAnimationFrame(draw);
}
draw();

// ===== Screen 2 reveal =====
const reveals = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("is-on")),
  { threshold: 0.35 }
);
reveals.forEach((el) => io.observe(el));
