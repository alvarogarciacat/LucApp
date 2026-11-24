// Estrellas y confeti.
const COLORS = ["#ffc93c", "#ff5d8f", "#3ccf7a", "#5ad1ff", "#ff9f43", "#b48cff"];

export class Particles {
  constructor() { this.list = []; }
  burst(x, y, n = 28, size = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 7;
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 1, c: COLORS[i % COLORS.length], s: size * (0.6 + Math.random() * 0.8), star: i % 2 === 0, rot: Math.random() * 6 });
    }
  }
  rain(W, n = 60) {
    for (let i = 0; i < n; i++) this.list.push({ x: Math.random() * W, y: -20 - Math.random() * 300, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, life: 2.2, c: COLORS[i % COLORS.length], s: 10 + Math.random() * 10, star: i % 3 === 0, rot: Math.random() * 6 });
  }
  update(dt) {
    const k = dt / 16.7;
    for (const p of this.list) { p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.18 * k; p.life -= 0.018 * k; p.rot += 0.1 * k; }
    this.list = this.list.filter((p) => p.life > 0);
  }
  draw(g) {
    for (const p of this.list) {
      g.save();
      g.globalAlpha = Math.min(1, p.life);
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.fillStyle = p.c;
      if (p.star) starPath(g, 0, 0, p.s);
      else g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      g.restore();
    }
  }
}

export function starPath(g, x, y, s, fill = true) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? s * 0.45 : s;
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
  if (fill) g.fill();
}
