// Luca convertido en personaje de dibujos, movido por su propio cuerpo.
export const CHARACTERS = [
  { id: "dino", name: "Dino", need: 0, body: "#3fbf5f", limb: "#36a852", dark: "#1f6e35", glove: "#ffd54a", head: "#4fd06f", extra: "spikes" },
  { id: "robot", name: "Robot", need: 10, body: "#9aa9bf", limb: "#7f8ea6", dark: "#3e4a5e", glove: "#ff8a3d", head: "#b8c5d8", extra: "antenna" },
  { id: "astro", name: "Astronauta", need: 25, body: "#f2f4f8", limb: "#dfe4ee", dark: "#5a6478", glove: "#ff5d8f", head: "#f2f4f8", extra: "helmet" },
  { id: "hero", name: "Superhéroe", need: 50, body: "#2f6fe4", limb: "#285fc4", dark: "#13224a", glove: "#ff3b3b", head: "#ffcf9e", extra: "cape" },
];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ok = (p) => p && p.v > 0.4;

function stroke(g, pts, w, color, outline) {
  const vis = pts.filter(ok);
  if (vis.length < 2) return;
  g.beginPath();
  g.moveTo(vis[0].x, vis[0].y);
  for (let i = 1; i < vis.length; i++) g.lineTo(vis[i].x, vis[i].y);
  g.strokeStyle = outline;
  g.lineWidth = w + Math.max(4, w * 0.22);
  g.stroke();
  g.strokeStyle = color;
  g.lineWidth = w;
  g.stroke();
}

export function drawAvatar(g, p, ch, t, { alpha = 1, happy = false } = {}) {
  if (!p || !ok(p.ls) || !ok(p.rs)) return;
  g.save();
  g.globalAlpha = alpha;
  g.lineCap = "round";
  g.lineJoin = "round";
  const sw = Math.max(20, dist(p.ls, p.rs));
  const lw = sw * 0.34;
  const hipsOk = ok(p.lh) && ok(p.rh);
  const lh = hipsOk ? p.lh : { x: p.ls.x + sw * 0.2, y: p.ls.y + sw * 1.6, v: 1 };
  const rh = hipsOk ? p.rh : { x: p.rs.x - sw * 0.2, y: p.rs.y + sw * 1.6, v: 1 };

  // capa
  if (ch.extra === "cape") {
    const sway = Math.sin(t / 300) * sw * 0.15;
    g.fillStyle = "#ff3b3b";
    g.beginPath();
    g.moveTo(p.ls.x, p.ls.y);
    g.lineTo(p.rs.x, p.rs.y);
    g.lineTo(rh.x + sw * 0.45 + sway, rh.y + sw * 0.8);
    g.lineTo(lh.x - sw * 0.45 + sway, lh.y + sw * 0.8);
    g.closePath();
    g.fill();
  }

  // piernas
  stroke(g, [lh, p.lk, p.la], lw * 1.1, ch.limb, ch.dark);
  stroke(g, [rh, p.rk, p.ra], lw * 1.1, ch.limb, ch.dark);
  for (const a of [p.la, p.ra]) {
    if (!ok(a)) continue;
    g.fillStyle = ch.dark;
    g.beginPath();
    g.ellipse(a.x, a.y + lw * 0.25, lw * 0.8, lw * 0.5, 0, 0, 7);
    g.fill();
  }

  // tronco
  g.beginPath();
  g.moveTo(p.ls.x, p.ls.y);
  g.lineTo(p.rs.x, p.rs.y);
  g.lineTo(rh.x, rh.y);
  g.lineTo(lh.x, lh.y);
  g.closePath();
  g.strokeStyle = ch.dark;
  g.lineWidth = lw * 1.25;
  g.stroke();
  g.fillStyle = ch.body;
  g.strokeStyle = ch.body;
  g.lineWidth = lw;
  g.fill();
  g.stroke();
  // barriga / emblema
  const cx = (p.ls.x + p.rs.x + lh.x + rh.x) / 4, cy = (p.ls.y + p.rs.y + lh.y + rh.y) / 4;
  g.fillStyle = ch.extra === "hero" || ch.extra === "cape" ? "#ffc93c" : "rgba(255,255,255,.35)";
  g.beginPath();
  g.arc(cx, cy, sw * 0.28, 0, 7);
  g.fill();

  // brazos
  stroke(g, [p.ls, p.le, p.lw], lw, ch.limb, ch.dark);
  stroke(g, [p.rs, p.re, p.rw], lw, ch.limb, ch.dark);
  for (const w of [p.lw, p.rw]) {
    if (!ok(w)) continue;
    g.fillStyle = ch.dark;
    g.beginPath();
    g.arc(w.x, w.y, lw * 0.82, 0, 7);
    g.fill();
    g.fillStyle = ch.glove;
    g.beginPath();
    g.arc(w.x, w.y, lw * 0.68, 0, 7);
    g.fill();
  }

  // cabeza
  const head = ok(p.nose) ? p.nose : { x: (p.ls.x + p.rs.x) / 2, y: p.ls.y - sw * 0.7 };
  const r = sw * 0.62;
  const hx = head.x, hy = head.y - r * 0.15;
  if (ch.extra === "spikes") {
    g.fillStyle = "#ffc93c";
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI / 2 + i * 0.42;
      const bx = hx + Math.cos(a) * r * 0.92, by = hy + Math.sin(a) * r * 0.92;
      g.beginPath();
      g.moveTo(bx + Math.cos(a + 1.57) * r * 0.2, by + Math.sin(a + 1.57) * r * 0.2);
      g.lineTo(hx + Math.cos(a) * r * 1.35, hy + Math.sin(a) * r * 1.35);
      g.lineTo(bx - Math.cos(a + 1.57) * r * 0.2, by - Math.sin(a + 1.57) * r * 0.2);
      g.fill();
    }
  }
  if (ch.extra === "antenna") {
    g.strokeStyle = ch.dark;
    g.lineWidth = r * 0.12;
    g.beginPath();
    g.moveTo(hx, hy - r);
    g.lineTo(hx, hy - r * 1.5);
    g.stroke();
    g.fillStyle = Math.sin(t / 250) > 0 ? "#ff3b3b" : "#ffc93c";
    g.beginPath();
    g.arc(hx, hy - r * 1.55, r * 0.18, 0, 7);
    g.fill();
  }
  g.fillStyle = ch.dark;
  g.beginPath();
  if (ch.extra === "antenna") g.roundRect(hx - r * 1.08, hy - r * 1.08, r * 2.16, r * 2.06, r * 0.4);
  else g.arc(hx, hy, r * 1.08, 0, 7);
  g.fill();
  g.fillStyle = ch.head;
  g.beginPath();
  if (ch.extra === "antenna") g.roundRect(hx - r, hy - r, r * 2, r * 1.9, r * 0.35);
  else g.arc(hx, hy, r, 0, 7);
  g.fill();
  if (ch.extra === "helmet") {
    g.fillStyle = "#ffcf9e";
    g.beginPath();
    g.arc(hx, hy + r * 0.05, r * 0.72, 0, 7);
    g.fill();
  }
  if (ch.extra === "cape") {
    g.fillStyle = "#13224a";
    g.fillRect(hx - r * 0.85, hy - r * 0.32, r * 1.7, r * 0.38);
  }
  // ojos con parpadeo
  const blink = (t % 3800) < 140;
  for (const s of [-1, 1]) {
    const ex = hx + s * r * 0.36, ey = hy - r * 0.12;
    g.fillStyle = "#fff";
    g.beginPath();
    g.ellipse(ex, ey, r * 0.22, blink ? r * 0.03 : r * 0.26, 0, 0, 7);
    g.fill();
    if (!blink) {
      g.fillStyle = "#13224a";
      g.beginPath();
      g.arc(ex, ey + r * 0.04, r * 0.12, 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(ex + r * 0.04, ey - r * 0.02, r * 0.04, 0, 7);
      g.fill();
    }
  }
  // boca
  g.strokeStyle = "#13224a";
  g.lineWidth = r * 0.09;
  g.beginPath();
  if (happy) {
    g.fillStyle = "#b8324f";
    g.arc(hx, hy + r * 0.3, r * 0.3, 0, Math.PI);
    g.fill();
  } else {
    g.arc(hx, hy + r * 0.22, r * 0.28, 0.2, Math.PI - 0.2);
    g.stroke();
  }
  // mejillas
  g.fillStyle = "rgba(255,93,143,.45)";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(hx + s * r * 0.62, hy + r * 0.22, r * 0.13, 0, 7);
    g.fill();
  }
  if (ch.extra === "helmet") {
    g.strokeStyle = "rgba(160,210,255,.9)";
    g.lineWidth = r * 0.12;
    g.beginPath();
    g.arc(hx, hy, r * 1.25, 0, 7);
    g.stroke();
    g.fillStyle = "rgba(255,255,255,.35)";
    g.beginPath();
    g.ellipse(hx - r * 0.55, hy - r * 0.6, r * 0.25, r * 0.12, -0.6, 0, 7);
    g.fill();
  }
  g.restore();
}

/** Silueta fantasma de una postura (para el muro mágico). */
export function drawGhost(g, p, t, color = "#ffffff") {
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  const sw = dist(p.ls, p.rs);
  g.globalAlpha = 0.55 + 0.25 * Math.sin(t / 220);
  g.strokeStyle = color;
  g.setLineDash([sw * 0.25, sw * 0.18]);
  g.lineWidth = sw * 0.12;
  const seg = (arr) => { g.beginPath(); g.moveTo(arr[0].x, arr[0].y); for (const q of arr.slice(1)) g.lineTo(q.x, q.y); g.stroke(); };
  seg([p.lh, p.lk, p.la]);
  seg([p.rh, p.rk, p.ra]);
  seg([p.ls, p.rs, p.rh, p.lh, p.ls]);
  seg([p.ls, p.le, p.lw]);
  seg([p.rs, p.re, p.rw]);
  g.beginPath();
  g.arc(p.nose.x, p.nose.y - sw * 0.1, sw * 0.62, 0, 7);
  g.stroke();
  g.restore();
}
