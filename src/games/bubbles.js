// Burbujas mágicas: explota con las manos (o los pies) la burbuja que dice la voz.
import { sea } from "../scene.js";
import { NUMS, PRAISE, pick } from "../voice.js";
import { setCard, numberCard, colorCard, letterCard, starsCard } from "../hud.js";

const COLORS = [
  { name: "roja", c: "#ff3b3b" }, { name: "azul", c: "#2b7bff" }, { name: "amarilla", c: "#ffd31a" },
  { name: "verde", c: "#26c766" }, { name: "naranja", c: "#ff8a1f" }, { name: "morada", c: "#9b4dff" }, { name: "rosa", c: "#ff7ac3" },
];
const LETTERS = "AEIOUMPLS".split("");
const TINTS = ["#ffc93c", "#3ccf7a", "#ff5d8f", "#5ad1ff", "#ff9f43", "#b48cff"];
const ROUNDS = 9;
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export default {
  id: "burbujas",
  title: "Burbujas",
  icon: "🫧",
  color: "#5ad1ff",
  intro: "¡Burbujas mágicas! Explota con la mano la burbuja que yo te diga.",
  create(app) {
    let bubbles = [], target = null, kind = "numeros", round = 0, lock = true, roundStart = 0, wrongs = 0, hinted = false;
    const kinds = ["colores", "numeros", "letras"];

    const label = (v) => (kind === "numeros" ? "el número " + NUMS[v] : kind === "letras" ? "la letra " + v : "la burbuja " + v.name);

    function area(body) {
      // zona que Luca alcanza con los brazos
      const { W, H } = app;
      const c = body.center();
      if (!c || body.mode === "touch") return { x0: W * 0.12, x1: W * 0.88, y0: H * 0.18, y1: H * 0.7 };
      const sw = body.sw, p = body.p;
      return {
        x0: Math.max(W * 0.06, c.x - sw * 2.1), x1: Math.min(W * 0.94, c.x + sw * 2.1),
        y0: Math.max(H * 0.12, p.nose.y - sw * 1.4), y1: Math.min(H * 0.85, c.y + sw * 0.3),
      };
    }

    function newRound(body) {
      round++;
      if (round > ROUNDS) return app.finish();
      kind = kinds[(round - 1) % kinds.length];
      const pool = kind === "numeros" ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : kind === "letras" ? LETTERS : COLORS;
      const n = round < 4 ? 3 : 4;
      const choices = shuffle(pool).slice(0, n);
      target = pick(choices);
      const a = area(body);
      const r = Math.max(36, Math.min(app.W, app.H) * 0.085, body.sw * 0.6);
      // repartir en columnas para que no se pisen
      const cols = shuffle([...Array(n).keys()]);
      bubbles = choices.map((v, i) => {
        const fx = (cols[i] + 0.5) / n;
        return {
          v, r, pop: 0, wob: 0, heat: 0,
          bx: a.x0 + (a.x1 - a.x0) * fx,
          by: a.y0 + (a.y1 - a.y0) * (0.25 + Math.random() * 0.6),
          x: 0, y: app.H + r * 2 + i * 60, // entran desde abajo
          phase: Math.random() * 6.28,
          tint: kind === "colores" ? v.c : TINTS[i % TINTS.length],
          born: performance.now(),
        };
      });
      roundStart = performance.now();
      wrongs = 0; hinted = false; lock = false;
      setCard(kind === "numeros" ? numberCard(target) : kind === "letras" ? letterCard(target) : colorCard(target.c));
      app.say("¡Explota " + label(target) + "!");
    }

    function hit(b, now) {
      if (lock || b.pop) return;
      if (b.v === target) {
        lock = true;
        b.pop = now;
        app.sfx.pop();
        app.particles.burst(b.x, b.y, 34, b.r * 0.3);
        app.star(b.x, b.y);
        setCard(starsCard());
        app.say(pick(PRAISE));
        app.happy();
        setTimeout(() => newRound(app.body), 1900);
      } else if (now - (b.lastWrong || 0) > 1500) {
        b.lastWrong = now;
        b.wob = 1;
        wrongs++;
        app.sfx.oops();
        const what = kind === "numeros" ? "Ese es el " + NUMS[b.v] : kind === "letras" ? "Esa es la " + b.v : "Esa es " + b.v.name;
        app.say(what + ". Busca " + label(target) + ".");
      }
    }

    setTimeout(() => newRound(app.body), 400);

    return {
      drawBack(g, now) { sea(g, app.W, app.H, now); },
      update(dt, now, body) {
        const hint = !lock && target && (wrongs >= 2 || now - roundStart > 9000);
        if (hint && !hinted && now - roundStart > 9000) { hinted = true; app.say("Mira, " + label(target) + " está brillando. ¡Explótala!"); }
        this.hint = hint;
        const hands = body.hitters(true);
        for (const b of bubbles) {
          if (b.pop) continue;
          // flotar hacia su sitio
          const tx = b.bx + Math.sin(now / 900 + b.phase) * 10;
          const ty = b.by + Math.cos(now / 1100 + b.phase) * 12;
          if (!b.x) b.x = tx;
          b.x += (tx - b.x) * 0.06;
          b.y += (ty - b.y) * 0.05;
          b.wob = Math.max(0, b.wob - dt / 600);
          if (now - b.born < 700) continue;
          for (const hnd of hands) if (Math.hypot(hnd.x - b.x, hnd.y - b.y) < b.r + hnd.r) { hit(b, now); break; }
        }
        bubbles = bubbles.filter((b) => !b.pop || now - b.pop < 300);
      },
      drawFront(g, now) {
        for (const b of bubbles) {
          const k = b.pop ? 1 + (now - b.pop) / 120 : 1;
          const x = b.x + (b.wob ? Math.sin(now / 30) * 12 * b.wob : 0), y = b.y, r = b.r * k;
          g.save();
          if (b.pop) g.globalAlpha = Math.max(0, 1 - (now - b.pop) / 300);
          if (this.hint && b.v === target) {
            g.strokeStyle = "#ffc93c";
            g.lineWidth = 10;
            g.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(now / 200));
            g.beginPath();
            g.arc(x, y, r + 16 + Math.sin(now / 160) * 6, 0, 7);
            g.stroke();
            g.globalAlpha = 1;
          }
          const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
          gr.addColorStop(0, "#ffffff");
          gr.addColorStop(0.3, b.tint);
          gr.addColorStop(1, b.tint);
          g.fillStyle = gr;
          g.beginPath();
          g.arc(x, y, r, 0, 7);
          g.fill();
          g.lineWidth = 5;
          g.strokeStyle = "rgba(255,255,255,.9)";
          g.stroke();
          if (kind !== "colores") {
            g.fillStyle = "#13224a";
            g.font = `800 ${Math.round(r * 1.05)}px "Baloo 2", system-ui, sans-serif`;
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillText(String(b.v), x, y + r * 0.06);
          }
          g.restore();
        }
      },
      repeat() { if (target && !lock) app.say("¡Explota " + label(target) + "!"); },
    };
  },
};
