// El muro mágico: copia la postura del fantasma antes de que llegue el muro. Tipo "hole in the wall", para peques.
import { magic } from "../scene.js";
import { PRAISE, pick } from "../voice.js";
import { setCard, poseCard, starsCard } from "../hud.js";
import { skeleton } from "../body.js";
import { drawGhost } from "../avatar.js";

const POSES = [
  { id: "arbol", say: "¡Brazos arriba, como un árbol muy alto!" },
  { id: "avion", say: "¡Abre los brazos como un avión!" },
  { id: "cintura", say: "¡Manos en la cintura!" },
  { id: "estrella", say: "¡Haz la estrella! Brazos arriba y piernas abiertas." },
  { id: "saludo", say: "¡Saluda con una mano muy arriba!" },
  { id: "pelota", say: "¡Hazte una pelota pequeñita! Agáchate." },
];
const TOTAL = 6;
const HOLD = 700; // ms que tiene que aguantar la postura

export default {
  id: "muro",
  title: "Muro mágico",
  icon: "🧱",
  color: "#b48cff",
  needsBody: true,
  intro: "¡El muro mágico! Copia la postura del fantasma para atravesar el muro.",
  create(app) {
    let order = [...POSES].sort(() => Math.random() - 0.5);
    let i = -1, cur = null, z = 0, held = 0, state = "idle", t0 = 0, nag = 0, passAt = 0;

    function next(now) {
      i++;
      if (i >= TOTAL) return app.finish();
      cur = order[i % order.length];
      z = 0; held = 0; state = "come"; t0 = now; nag = 0;
      setCard(poseCard(cur.id));
      app.say(cur.say);
    }
    setTimeout(() => next(performance.now()), 500);

    return {
      drawBack(g, now) { magic(g, app.W, app.H, now); },
      update(dt, now, body) {
        if (!cur) return;
        if (state === "come") {
          z = Math.min(1, z + dt / 4500);
          const ok = body.mode === "touch" ? body.touches.length > 0 : body.matches(cur.id);
          held = ok ? held + dt : Math.max(0, held - dt * 0.5);
          if (held >= HOLD) {
            state = "pass"; passAt = now;
            app.sfx.good(); app.happy();
            const c = body.center() || { x: app.W / 2, y: app.H / 2 };
            app.star(c.x, c.y - body.sw);
            app.particles.burst(c.x, c.y, 50, 14);
            setCard(starsCard());
            app.say(pick(PRAISE));
            setTimeout(() => next(performance.now()), 2300);
          } else if (z >= 1) {
            // el muro espera: nunca se pierde
            const w = now - t0;
            if (w > 9000 && nag === 0) { nag = 1; app.say("Mira el dibujo. " + cur.say); }
            if (w > 20000 && nag === 1) { nag = 2; state = "pass"; passAt = now; app.say("¡Muy bien intentado! Vamos con otra."); setTimeout(() => next(performance.now()), 2000); }
          }
        }
        this.body = body;
      },
      draw(g, now) {
        if (!cur) return;
        const { W, H } = app;
        const body = this.body;
        // muro que se acerca (perspectiva)
        let k = state === "pass" ? 1 + (now - passAt) / 250 : 0.25 + z * 0.75;
        const alpha = state === "pass" ? Math.max(0, 1 - (now - passAt) / 600) : 0.35 + z * 0.4;
        const ww = W * 0.9 * k, wh = H * 0.85 * k;
        const wx = W / 2 - ww / 2, wy = H * 0.55 - wh / 2;
        g.save();
        g.globalAlpha = alpha;
        g.fillStyle = "#6a3fc4";
        g.fillRect(wx, wy, ww, wh);
        g.strokeStyle = "rgba(255,255,255,.18)";
        g.lineWidth = 3 * k;
        const bh = 40 * k, bw = 90 * k;
        for (let y = 0, row = 0; y < wh; y += bh, row++) {
          for (let x = (row % 2) * -bw / 2; x < ww; x += bw) g.strokeRect(wx + x, wy + y, bw, bh);
        }
        g.restore();
        // fantasma de la postura colocado sobre el cuerpo de Luca
        const c = body && body.center();
        const sw = body ? body.sw : 80;
        const cx = c ? c.x : W / 2;
        const hipY = body && body.p && body.mode === "camera" ? (body.p.lh.y + body.p.rh.y) / 2 : H * 0.86 - sw * 2.1;
        this.ghostAt = { cx, hipY, sw };
      },
      drawFront(g, now) {
        if (!cur || !this.ghostAt) return;
        const { cx, hipY, sw } = this.ghostAt;
        if (state !== "pass") {
          const ghost = skeleton(cx, hipY, sw, cur.id);
          drawGhost(g, ghost, now, held > 0 ? "#ffc93c" : "#ffffff");
          // barra de "aguanta"
          if (held > 0) {
            const bwid = sw * 2.4;
            g.fillStyle = "rgba(0,0,0,.35)";
            g.beginPath(); g.roundRect(cx - bwid / 2, hipY - sw * 3.6, bwid, sw * 0.3, sw * 0.15); g.fill();
            g.fillStyle = "#3ccf7a";
            g.beginPath(); g.roundRect(cx - bwid / 2, hipY - sw * 3.6, bwid * Math.min(1, held / HOLD), sw * 0.3, sw * 0.15); g.fill();
          }
        }
      },
      repeat() { if (cur && state === "come") app.say(cur.say); },
    };
  },
};
