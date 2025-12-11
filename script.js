// 네비게이션 a 태그 부드러운 스크롤
const navLinks = document.querySelectorAll('.nav a, .hero-actions a');

navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
});

// 스크롤 시 헤더에 살짝 그림자 (조용한 효과)
const header = document.querySelector('.site-header');

const handleScroll = () => {
  if (window.scrollY > 10) {
    header.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.7)';
  } else {
    header.style.boxShadow = 'none';
  }
};

window.addEventListener('scroll', handleScroll);
handleScroll();
// ===============================
// 1. 부드러운 스크롤 (기존 기능)
// ===============================
const navLinks = document.querySelectorAll('.nav a, .hero-actions a');

navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
});

// ===============================
// 2. 헤더 그림자 효과 (기존 기능)
// ===============================
const header = document.querySelector('.site-header');

const handleScroll = () => {
  if (window.scrollY > 10) {
    header.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.7)';
  } else {
    header.style.boxShadow = 'none';
  }
};

window.addEventListener('scroll', handleScroll);
handleScroll();

// ===============================
// 3. 전자가 도는 배경 애니메이션
// ===============================
const canvas = document.getElementById('orbit-bg');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;
let electrons = [];

// 전자(점) 개수와 궤도 수
const ORBIT_COUNT = 4;
const ELECTRONS_PER_ORBIT = 3;

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  centerX = width / 2;
  centerY = height / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 전자 객체 만들기
function createElectrons() {
  electrons = [];
  for (let orbit = 1; orbit <= ORBIT_COUNT; orbit++) {
    const radius = orbit * 60 + 40; // 궤도 반지름
    for (let i = 0; i < ELECTRONS_PER_ORBIT; i++) {
      electrons.push({
        orbitRadius: radius,
        angle: (Math.PI * 2 * i) / ELECTRONS_PER_ORBIT,
        speed: (0.002 + orbit * 0.0006) * (Math.random() > 0.5 ? 1 : -1),
        size: 3 + Math.random() * 1.5,
      });
    }
  }
}

createElectrons();

// 애니메이션 루프
function animate() {
  requestAnimationFrame(animate);

  // 살짝 어둡게 덮어주기 (잔상이 남는 느낌)
  ctx.fillStyle = 'rgba(5, 6, 8, 0.32)';
  ctx.fillRect(0, 0, width, height);

  // 중심에서 발광하는 느낌
  const grad = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, width * 0.7
  );
  grad.addColorStop(0, 'rgba(255, 106, 0, 0.10)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 궤도 원(아주 옅게)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.lineWidth = 1;

  for (let o = 1; o <= ORBIT_COUNT; o++) {
    const r = o * 60 + 40;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 전자 그리기
  electrons.forEach((e) => {
    e.angle += e.speed;

    const x = centerX + Math.cos(e.angle) * e.orbitRadius;
    const y = centerY + Math.sin(e.angle) * e.orbitRadius;

    // 전자 빛나는 부분
    const glowRadius = e.size * 5;
    const glowGrad = ctx.createRadialGradient(
      x, y, 0,
      x, y, glowRadius
    );
    glowGrad.addColorStop(0, 'rgba(255, 140, 50, 0.9)');
    glowGrad.addColorStop(1, 'rgba(255, 140, 50, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 중심 코어
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.arc(x, y, e.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

animate();
