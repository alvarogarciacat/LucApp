// Fondos dibujados a mano en canvas, uno por mundo.
function rnd(seed) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function cloud(g, x, y, s) {
  g.fillStyle = "rgba(255,255,255,.92)";
  g.beginPath();
  g.arc(x, y, s, 0, 7);
  g.arc(x + s * 0.9, y - s * 0.35, s * 0.8, 0, 7);
  g.arc(x + s * 1.8, y, s * 0.9, 0, 7);
  g.arc(x + s * 0.9, y + s * 0.2, s * 0.9, 0, 7);
  g.fill();
}

function hills(g, W, H, y, amp, color, off, freq = 1) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, y + Math.sin((x + off) / (W / (3 * freq))) * amp + Math.sin((x + off) / 97) * amp * 0.3);
  g.lineTo(W, H);
  g.fill();
}

export function sea(g, W, H, t) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#38b6ff");
  gr.addColorStop(1, "#0b4fa8");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,.07)";
  for (let i = 0; i < 5; i++) {
    const x = ((i * W) / 4 + Math.sin(t / 3000 + i) * 40) % (W + 200) - 100;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 120, 0);
    g.lineTo(x + 260, H);
    g.lineTo(x + 60, H);
    g.fill();
  }
  const r = rnd(7);
  for (let i = 0; i < 9; i++) {
    const x = r() * W, h = H * (0.12 + r() * 0.18);
    g.strokeStyle = i % 2 ? "#1fa36a" : "#2cc97f";
    g.lineWidth = 14;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x, H);
    for (let k = 1; k <= 6; k++) g.lineTo(x + Math.sin(t / 700 + k + i) * 12, H - (h * k) / 6);
    g.stroke();
  }
  g.fillStyle = "#f2d38b";
  g.beginPath();
  g.ellipse(W / 2, H + H * 0.05, W * 0.8, H * 0.1, 0, 0, 7);
  g.fill();
}

export function orchard(g, W, H, t) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#7fd3ff");
  gr.addColorStop(1, "#d6f3ff");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#ffd84d";
  g.beginPath();
  g.arc(W * 0.88, H * 0.14, Math.min(W, H) * 0.07, 0, 7);
  g.fill();
  cloud(g, ((t / 60) % (W + 300)) - 200, H * 0.13, H * 0.05);
  cloud(g, ((t / 90 + W / 2) % (W + 300)) - 200, H * 0.24, H * 0.04);
  hills(g, W, H, H * 0.7, H * 0.04, "#8fd96b", 0);
  hills(g, W, H, H * 0.8, H * 0.03, "#5fbf4a", 300);
  for (const [x, s] of [[W * 0.06, 1], [W * 0.94, 1.1]]) {
    g.fillStyle = "#8a5a33";
    g.fillRect(x - H * 0.025 * s, H * 0.45, H * 0.05 * s, H * 0.4);
    g.fillStyle = "#3fa34d";
    g.beginPath();
    g.arc(x, H * 0.4, H * 0.16 * s, 0, 7);
    g.fill();
  }
}

export function jungle(g, W, H, t, scroll) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#ffe7a3");
  gr.addColorStop(1, "#b6f0b0");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  hills(g, W, H, H * 0.55, H * 0.06, "#7dcf7a", scroll * 0.2, 0.7);
  // árboles lejanos
  const r = rnd(3);
  for (let i = 0; i < 12; i++) {
    const base = r() * W * 2;
    const x = ((base - scroll * 0.5) % (W * 2) + W * 2) % (W * 2) - W * 0.2;
    const h = H * (0.25 + r() * 0.2);
    g.fillStyle = "#6b4a2b";
    g.fillRect(x - 8, H * 0.82 - h, 16, h);
    g.fillStyle = i % 2 ? "#2f9e4f" : "#3cb85c";
    g.beginPath();
    g.arc(x, H * 0.82 - h, H * 0.09, 0, 7);
    g.arc(x - H * 0.06, H * 0.82 - h + H * 0.04, H * 0.06, 0, 7);
    g.arc(x + H * 0.06, H * 0.82 - h + H * 0.04, H * 0.06, 0, 7);
    g.fill();
  }
  // suelo
  g.fillStyle = "#c98f4f";
  g.fillRect(0, H * 0.86, W, H * 0.14);
  g.fillStyle = "#58b847";
  g.fillRect(0, H * 0.84, W, H * 0.03);
  g.fillStyle = "rgba(0,0,0,.08)";
  for (let x = -((scroll % 80) + 80); x < W; x += 80) g.fillRect(x, H * 0.9, 40, 6);
}

export function magic(g, W, H, t) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#2a1a5e");
  gr.addColorStop(1, "#7a3fb0");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  const r = rnd(11);
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H * 0.8, s = 1 + r() * 2.5;
    g.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t / 900 + i))})`;
    g.fillRect(x, y, s, s);
  }
  g.fillStyle = "#3b2477";
  g.fillRect(0, H * 0.85, W, H * 0.15);
  // camino hacia el horizonte
  g.fillStyle = "rgba(255,201,60,.18)";
  g.beginPath();
  g.moveTo(W * 0.45, H * 0.45);
  g.lineTo(W * 0.55, H * 0.45);
  g.lineTo(W * 0.95, H);
  g.lineTo(W * 0.05, H);
  g.fill();
}

export function menuBg(g, W, H, t) {
  orchard(g, W, H, t);
}

export function snow(g, W, H, t, scroll = 0) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#9fd4ff");
  gr.addColorStop(1, "#eaf6ff");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#cfe6f7";
  g.beginPath(); g.moveTo(0, H * 0.4); g.lineTo(W * 0.25, H * 0.12); g.lineTo(W * 0.5, H * 0.4); g.lineTo(W * 0.75, H * 0.18); g.lineTo(W, H * 0.4); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  g.fillStyle = "#ffffff";
  g.fillRect(0, H * 0.4, W, H * 0.6);
  // pinos que suben al bajar
  const r = rnd(5);
  for (let i = 0; i < 10; i++) {
    const x = r() < 0.5 ? r() * W * 0.12 : W - r() * W * 0.12;
    const y = ((r() * H * 1.5 - scroll) % (H * 1.5) + H * 1.5) % (H * 1.5) - H * 0.2;
    g.fillStyle = "#2f7a4f";
    g.beginPath(); g.moveTo(x, y - 50); g.lineTo(x + 28, y + 20); g.lineTo(x - 28, y + 20); g.fill();
  }
  g.fillStyle = "rgba(255,255,255,.8)";
  for (let i = 0; i < 40; i++) { const x = (i * 97 + t / 20) % W, y = (i * 53 + t / 8) % H; g.fillRect(x, y, 3, 3); }
}

export function pond(g, W, H, t) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#bde9ff");
  gr.addColorStop(0.45, "#8fdc8a");
  gr.addColorStop(0.46, "#3fb3c9");
  gr.addColorStop(1, "#1f7fa8");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(255,255,255,.25)";
  g.lineWidth = 3;
  for (let i = 0; i < 8; i++) { const y = H * 0.55 + i * H * 0.06; g.beginPath(); g.moveTo(((i * 131 + t / 30) % W), y); g.lineTo(((i * 131 + t / 30) % W) + 60, y); g.stroke(); }
}

export function meadow(g, W, H, t) {
  orchard(g, W, H, t);
}

export function skyfly(g, W, H, t, scroll) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "#5ab8ff");
  gr.addColorStop(1, "#ffe2b8");
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  const r = rnd(9);
  for (let i = 0; i < 8; i++) {
    const x = ((r() * W * 2 - scroll * (0.3 + r() * 0.4)) % (W * 2) + W * 2) % (W * 2) - 200;
    cloud(g, x, r() * H * 0.8, 30 + r() * 30);
  }
  hills(g, W, H, H * 0.9, H * 0.03, "#6cc46a", scroll * 0.5);
}

export function stage(g, W, H, t, lit = true) {
  g.fillStyle = "#2a1640";
  g.fillRect(0, 0, W, H);
  const cols = ["#ff5d8f", "#ffc93c", "#5ad1ff", "#3ccf7a"];
  if (lit) for (let i = 0; i < 4; i++) {
    const x = W * (0.15 + i * 0.23), sw = Math.sin(t / 600 + i) * W * 0.1;
    g.fillStyle = cols[i] + "40";
    g.beginPath(); g.moveTo(x - 20, 0); g.lineTo(x + 20, 0); g.lineTo(x + sw + W * 0.12, H); g.lineTo(x + sw - W * 0.12, H); g.fill();
  }
  g.fillStyle = "#4a2a6a";
  g.fillRect(0, H * 0.85, W, H * 0.15);
  g.fillStyle = "#b8324f";
  g.fillRect(0, 0, W * 0.06, H); g.fillRect(W * 0.94, 0, W * 0.06, H);
}

export function room(g, W, H, t) {
  g.fillStyle = "#ffe9c7";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#c98f4f";
  g.fillRect(0, H * 0.88, W, H * 0.12);
}
