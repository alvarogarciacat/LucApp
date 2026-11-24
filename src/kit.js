// Piezas comunes para los juegos.
import { PRAISE, pick } from "./voice.js";
import { setCard, starsCard } from "./hud.js";
import { starPath } from "./particles.js";

export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export { pick };

/** Zona de la pantalla que Luca alcanza con brazos (y pies si feet). */
export function reach(app, body, { feet = false } = {}) {
  const { W, H } = app;
  const c = body.center();
  if (!c || body.mode === "touch") return { x0: W * 0.1, x1: W * 0.9, y0: H * 0.2, y1: H * (feet ? 0.8 : 0.72) };
  const sw = body.sw, p = body.p;
  return {
    x0: clamp(c.x - sw * 2.1, W * 0.06, W * 0.9), x1: clamp(c.x + sw * 2.1, W * 0.1, W * 0.94),
    y0: clamp(p.nose.y - sw * 1.4, H * 0.14, H * 0.6), y1: clamp(feet ? c.y + sw * 2.6 : c.y + sw * 0.3, H * 0.3, H * 0.92),
  };
}

/** Reparte n puntos en la zona sin que se pisen. */
export function spread(n, a) {
  const cols = n <= 3 ? n : Math.ceil(n / 2), rows = Math.ceil(n / cols);
  const cells = shuffle([...Array(cols * rows).keys()]).slice(0, n);
  return cells.map((i) => {
    const cx = i % cols, cy = Math.floor(i / cols);
    return {
      x: a.x0 + (a.x1 - a.x0) * ((cx + 0.5) / cols) + rand(-1, 1) * (a.x1 - a.x0) * 0.06 / cols,
      y: a.y0 + (a.y1 - a.y0) * (rows === 1 ? rand(0.3, 0.7) : (cy + 0.5) / rows),
    };
  });
}

export function touching(hands, x, y, r) {
  return hands.some((h) => Math.hypot(h.x - x, h.y - y) < r + h.r);
}

/** Burbuja/disco brillante. */
export function disc(g, x, y, r, tint, alpha = 1) {
  g.save();
  g.globalAlpha = alpha;
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, "#ffffff");
  gr.addColorStop(0.3, tint);
  gr.addColorStop(1, tint);
  g.fillStyle = gr;
  g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.lineWidth = Math.max(3, r * 0.08);
  g.strokeStyle = "rgba(255,255,255,.9)";
  g.stroke();
  g.restore();
}

export function text(g, t, x, y, size, color = "#13224a") {
  g.fillStyle = color;
  g.font = `800 ${Math.round(size)}px "Baloo 2", system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(t, x, y + size * 0.06);
}

export function emoji(g, e, x, y, size) {
  g.font = `${Math.round(size)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(e, x, y);
}

/** Formas geométricas. */
export const SHAPES = {
  circulo: "el círculo", cuadrado: "el cuadrado", triangulo: "el triángulo", estrella: "la estrella", corazon: "el corazón", rombo: "el rombo",
};
export function shape(g, kind, x, y, r, color) {
  g.save();
  g.fillStyle = color;
  g.strokeStyle = "#13224a";
  g.lineWidth = Math.max(3, r * 0.1);
  g.lineJoin = "round";
  g.beginPath();
  if (kind === "circulo") g.arc(x, y, r, 0, 7);
  else if (kind === "cuadrado") g.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
  else if (kind === "triangulo") { g.moveTo(x, y - r); g.lineTo(x + r * 0.95, y + r * 0.75); g.lineTo(x - r * 0.95, y + r * 0.75); g.closePath(); }
  else if (kind === "rombo") { g.moveTo(x, y - r); g.lineTo(x + r * 0.75, y); g.lineTo(x, y + r); g.lineTo(x - r * 0.75, y); g.closePath(); }
  else if (kind === "estrella") { starPath(g, x, y + r * 0.08, r * 1.05, false); }
  else if (kind === "corazon") {
    g.moveTo(x, y + r * 0.85);
    g.bezierCurveTo(x - r * 1.3, y, x - r * 0.7, y - r * 1.1, x, y - r * 0.4);
    g.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.3, y, x, y + r * 0.85);
  }
  g.fill();
  g.stroke();
  g.restore();
}

/** Puntos de dado. */
export function dice(g, n, x, y, r, color = "#13224a") {
  const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  g.fillStyle = color;
  for (const [dx, dy] of P[n] || []) { g.beginPath(); g.arc(x + dx * r * 0.45, y + dy * r * 0.45, r * 0.15, 0, 7); g.fill(); }
}

/** Aro amarillo parpadeante de pista. */
export function ring(g, x, y, r, now) {
  g.save();
  g.strokeStyle = "#ffc93c";
  g.lineWidth = 10;
  g.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(now / 200));
  g.beginPath(); g.arc(x, y, r + 16 + Math.sin(now / 160) * 6, 0, 7); g.stroke();
  g.restore();
}

/** Celebración estándar de acierto. */
export function win(app, x, y, { text: t, card = true } = {}) {
  app.sfx.good();
  app.star(x, y);
  app.particles.burst(x, y, 30, 12);
  app.happy();
  if (card) setCard(starsCard());
  app.say(t || pick(PRAISE));
}

/** Tarjeta con un dibujo hecho en canvas. */
export function canvasCard(draw, w = 110, h = 110) {
  const cv = document.createElement("canvas");
  cv.width = w * 2; cv.height = h * 2;
  cv.style.width = w + "px"; cv.style.height = h + "px";
  const g = cv.getContext("2d");
  g.scale(2, 2);
  draw(g, w, h);
  return cv;
}

/**
 * Fábrica de juegos de "toca el correcto": cada ronda pone varios objetos flotando y la voz pide uno.
 * makeRound(i) -> { items: [{ v, draw(g,x,y,r) }], target, ask, card, wrong(v), right?() }
 */
export function pickGame(def) {
  return {
    ...def,
    create(app) {
      let items = [], round = null, i = 0, lock = true, t0 = 0, wrongs = 0, hinted = false;
      const st = def.state ? def.state() : {};
      function next() {
        if (i >= def.rounds) return app.finish();
        round = def.makeRound(i++, st);
        if (!round) return app.finish();
        const a = reach(app, app.body, { feet: !!def.feet });
        const pos = spread(round.items.length, a);
        const r = Math.max(38, Math.min(app.W, app.H) * 0.085, app.body.sw * 0.62);
        items = round.items.map((it, k) => ({ ...it, x: pos[k].x, y: app.H + r * 2, tx: pos[k].x, ty: pos[k].y, r, ph: Math.random() * 6, born: performance.now(), wob: 0 }));
        t0 = performance.now(); wrongs = 0; hinted = false; lock = false;
        setCard(round.card());
        app.say(round.ask);
      }
      setTimeout(next, 400);
      return {
        drawBack: def.back ? (g, now) => def.back(g, app.W, app.H, now) : null,
        update(dt, now, body) {
          if (!round) return;
          this.hint = !lock && (wrongs >= 2 || now - t0 > 9000);
          if (this.hint && !hinted && now - t0 > 9000) { hinted = true; app.say("Mira, está brillando. ¡Tócalo!"); }
          const hands = body.hitters(!!def.feet);
          for (const it of items) {
            if (it.pop) continue;
            it.x += (it.tx + Math.sin(now / 900 + it.ph) * 8 - it.x) * 0.08;
            it.y += (it.ty + Math.cos(now / 1100 + it.ph) * 10 - it.y) * 0.06;
            it.wob = Math.max(0, it.wob - dt / 600);
            if (lock || now - it.born < 800 || !touching(hands, it.x, it.y, it.r)) continue;
            if (it.v === round.target) {
              lock = true; it.pop = now; app.sfx.pop();
              win(app, it.x, it.y, { text: round.right ? round.right() : null });
              setTimeout(next, 2000);
            } else if (now - (it.lastWrong || 0) > 1600) {
              it.lastWrong = now; it.wob = 1; wrongs++; app.sfx.oops();
              app.say(round.wrong(it.v));
            }
          }
          items = items.filter((it) => !it.pop || now - it.pop < 300);
        },
        drawFront(g, now) {
          for (const it of items) {
            const k = it.pop ? 1 + (now - it.pop) / 150 : 1;
            const x = it.x + (it.wob ? Math.sin(now / 30) * 12 * it.wob : 0);
            g.save();
            if (it.pop) g.globalAlpha = Math.max(0, 1 - (now - it.pop) / 300);
            if (this.hint && round && it.v === round.target) ring(g, x, it.y, it.r, now);
            it.draw(g, x, it.y, it.r * k);
            g.restore();
          }
        },
        repeat() { if (round && !lock) app.say(round.ask); },
      };
    },
  };
}
