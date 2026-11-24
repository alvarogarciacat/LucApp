// Lluvia de frutas: atrapa con las manos el número de frutas que te piden. Contar + reconocer.
import { orchard } from "../scene.js";
import { NUMS, PRAISE, pick } from "../voice.js";
import { setCard, fruitCard, starsCard } from "../hud.js";

const FRUITS = [
  { e: "🍎", one: "manzana", many: "manzanas" },
  { e: "🍌", one: "plátano", many: "plátanos" },
  { e: "🍓", one: "fresa", many: "fresas" },
  { e: "🍊", one: "naranja", many: "naranjas" },
  { e: "🍇", one: "racimo de uvas", many: "racimos de uvas" },
  { e: "🍐", one: "pera", many: "peras" },
];
const ORDERS = [1, 2, 3, 3, 4, 5];

export default {
  id: "frutas",
  title: "Frutas",
  icon: "🍎",
  color: "#ff5d8f",
  intro: "¡Lluvia de frutas! Atrapa con las manos las frutas que te pida.",
  create(app) {
    let order = -1, want = null, need = 0, got = 0, items = [], spawnT = 0, lock = true, orderStart = 0;
    const ask = () => {
      const fem = ["manzana", "fresa", "naranja", "pera"].includes(want.one);
      const num = need === 1 ? (fem ? "una" : "un") : NUMS[need];
      return "¡Atrapa " + num + " " + (need === 1 ? want.one : want.many) + "!";
    };
    function next() {
      order++;
      if (order >= ORDERS.length) return app.finish();
      need = ORDERS[order];
      got = 0;
      want = pick(FRUITS.filter((f) => f !== want));
      lock = false;
      orderStart = performance.now();
      setCard(fruitCard(want.e, need, 0));
      app.say(ask());
    }
    function area(body) {
      const { W } = app;
      const c = body.center();
      if (!c || body.mode === "touch") return [W * 0.12, W * 0.88];
      return [Math.max(W * 0.06, c.x - body.sw * 2), Math.min(W * 0.94, c.x + body.sw * 2)];
    }
    setTimeout(next, 400);

    return {
      drawBack(g, now) { orchard(g, app.W, app.H, now); },
      update(dt, now, body) {
        if (lock || !want) return;
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = 1100 - order * 60;
          const [x0, x1] = area(body);
          // la fruta buscada sale a menudo y más si tarda
          const bias = now - orderStart > 12000 ? 0.75 : 0.5;
          const f = Math.random() < bias ? want : pick(FRUITS);
          items.push({ f, x: x0 + Math.random() * (x1 - x0), y: -40, vy: app.H / (5200 - order * 250), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.004, caught: 0 });
        }
        const hands = body.hitters(false);
        const size = Math.max(44, Math.min(app.W, app.H) * 0.09, body.sw * 0.7);
        for (const it of items) {
          if (it.caught) continue;
          it.y += it.vy * dt;
          it.rot += it.vr * dt;
          for (const hnd of hands) {
            if (Math.hypot(hnd.x - it.x, hnd.y - it.y) < size * 0.6 + hnd.r) {
              it.caught = now;
              if (it.f === want) {
                got++;
                app.sfx.pop();
                app.particles.burst(it.x, it.y, 18, 10);
                setCard(fruitCard(want.e, need, got));
                if (got >= need) {
                  lock = true;
                  app.star(it.x, it.y);
                  app.happy();
                  setTimeout(() => setCard(starsCard()), 500);
                  app.say(NUMS[got] + ". " + pick(PRAISE));
                  setTimeout(() => { items = []; next(); }, 2400);
                } else {
                  app.say(NUMS[got] + "!");
                  app.sfx.tick(got);
                }
              } else {
                it.wrong = true;
                app.sfx.oops();
                app.say("¡Uy! Eso es " + (["manzana", "fresa", "naranja", "pera"].includes(it.f.one) ? "una " : "un ") + it.f.one + ".");
              }
              break;
            }
          }
        }
        this.size = size;
        items = items.filter((it) => it.y < app.H + 80 && (!it.caught || now - it.caught < 400));
      },
      drawFront(g, now) {
        const size = this.size || 60;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = `${Math.round(size)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        for (const it of items) {
          g.save();
          g.translate(it.x, it.y);
          g.rotate(it.rot);
          if (it.caught) {
            const k = (now - it.caught) / 400;
            g.globalAlpha = 1 - k;
            g.scale(1 + k * (it.wrong ? 0 : 0.8), 1 + k * (it.wrong ? 0 : 0.8));
          }
          g.fillText(it.f.e, 0, 0);
          g.restore();
        }
      },
      repeat() { if (want && !lock) app.say(ask()); },
    };
  },
};
