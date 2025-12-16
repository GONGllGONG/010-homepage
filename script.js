const canvas = document.getElementById('orbit-canvas');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;

const dot = {
  angle: 0,
  radius: 140,
  size: 3,
  speed: 0.00055,
};

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  centerX = width / 2;
  centerY = height / 2 + height * 0.02;
}

function clear() {
  ctx.fillStyle = 'rgba(5, 5, 5, 0.4)';
  ctx.fillRect(0, 0, width, height);
}

function drawGlow(x, y) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 36);
  glow.addColorStop(0, 'rgba(255, 138, 31, 0.5)');
  glow.addColorStop(1, 'rgba(255, 138, 31, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 36, 0, Math.PI * 2);
  ctx.fill();
}

function drawDot(x, y) {
  ctx.fillStyle = '#ff8a1f';
  ctx.beginPath();
  ctx.arc(x, y, dot.size, 0, Math.PI * 2);
  ctx.fill();
}

function frame() {
  requestAnimationFrame(frame);
  clear();

  const x = centerX + Math.cos(dot.angle) * dot.radius;
  const y = centerY + Math.sin(dot.angle) * dot.radius;

  drawGlow(x, y);
  drawDot(x, y);

  dot.angle += dot.speed;
}

window.addEventListener('resize', resize);
resize();
frame();
