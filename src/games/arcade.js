// Topos, tambores, portero, limpia la ventana y estírate.
import { reach, spread, touching, disc, text, emoji, ring, win, rand, pick, shuffle, clamp } from "../kit.js";
import { meadow, stage, orchard, room, magic } from "../scene.js";
import { NUMS, PRAISE } from "../voice.js";
import { setCard, numberCard, starsCard, h } from "../hud.js";
import { starPath } from "../particles.js";

// ---------- Topos ----------
export const topos = {
  id: "topos", title: "Topos", icon: "🐹", color: "#c98f4f", feet: true,
  intro: "¡Los topos traviesos! Cuando salga un topo, dale con la mano.",
  create(app) {
    let holes = [], hits = 0, next = 1200, total = 0;
    const GOAL = 12;
    function layout() {
      const a = reach(app, app.body, { feet: false });
      holes = spread(6, a).map((p) => ({ ...p, up: 0, until: 0, hit: 0 }));
    }
    layout();
    setCard(numberCard(0));
    return {
      drawBack(g, now) { meadow(g, app.W, app.H, now); },
      update(dt, now, body) {
        const r = Math.max(40, Math.min(app.W, app.H) * 0.08, body.sw * 0.6);
        this.r = r;
        next -= dt;
        if (next <= 0 && total < GOAL + 8) {
          const free = holes.filter((o) => !o.until);
          if (free.length) { const o = pick(free); o.until = now + Math.max(1500, 2600 - hits * 60); o.hit = 0; total++; }
          next = rand(900, 1500);
        }
        const hands = body.hitters(true);
        for (const o of holes) {
          if (o.until && now > o.until) { o.until = 0; o.hit = 0; }
          if (o.until && !o.hit && touching(hands, o.x, o.y, r)) {
            o.hit = now; o.until = now + 400; hits++;
            app.sfx.pop(); app.particles.burst(o.x, o.y, 16, 10);
            setCard(numberCard(hits));
            app.say(hits <= 10 ? NUMS[hits] + "!" : "¡Toma!");
            if (hits % 3 === 0) app.star(o.x, o.y - r);
            if (hits >= GOAL) setTimeout(() => app.finish(), 1200);
          }
        }
        if (total >= GOAL + 8 && holes.every((o) => !o.until)) app.finish();
      },
      drawFront(g, now) {
        const r = this.r || 50;
        for (const o of holes) {
          g.fillStyle = "#5a3a1e";
          g.beginPath(); g.ellipse(o.x, o.y + r * 0.6, r * 1.1, r * 0.35, 0, 0, 7); g.fill();
          if (o.until) {
            g.save();
            g.beginPath(); g.rect(o.x - r * 1.2, o.y - r * 2, r * 2.4, r * 2.6); g.clip();
            const pop = o.hit ? 1 - (now - o.hit) / 400 : Math.min(1, (o.until - now) / 250, 1);
            emoji(g, o.hit ? "😵" : "🐹", o.x, o.y + (1 - Math.max(0, pop)) * r, r * 1.5);
            g.restore();
          }
          g.fillStyle = "#7a5230";
          g.beginPath(); g.ellipse(o.x, o.y + r * 0.75, r * 1.15, r * 0.22, 0, 0, Math.PI); g.fill();
        }
      },
      repeat() { app.say("¡Dale a los topos con la mano!"); },
    };
  },
};

// ---------- Tambores (memoria de colores y sonidos) ----------
const DRUMS = [{ c: "#ff3b3b", n: "rojo", f: 262 }, { c: "#2b7bff", n: "azul", f: 330 }, { c: "#ffd31a", n: "amarillo", f: 392 }, { c: "#26c766", n: "verde", f: 523 }];
export const tambores = {
  id: "tambores", title: "Tambores", icon: "🥁", color: "#ff3b3b",
  intro: "¡Los tambores mágicos! Mira y escucha. Luego toca los tambores igual que yo.",
  create(app) {
    let drums = [], seq = [], pos = 0, state = "wait", showI = 0, showT = 0, level = 2, rounds = 0, lit = -1, litUntil = 0, armed = [true, true, true, true];
    function layout() {
      const a = reach(app, app.body);
      const cx = (a.x0 + a.x1) / 2, dx = (a.x1 - a.x0) * 0.36, y0 = a.y0 + (a.y1 - a.y0) * 0.2, y1 = a.y0 + (a.y1 - a.y0) * 0.85;
      drums = [{ x: cx - dx, y: y0 }, { x: cx + dx, y: y0 }, { x: cx - dx, y: y1 }, { x: cx + dx, y: y1 }].map((p, i) => ({ ...p, ...DRUMS[i] }));
    }
    function hit(i, now) { lit = i; litUntil = now + 350; }
    function newSeq() {
      if (rounds >= 6) return app.finish();
      rounds++;
      layout();
      seq = [...Array(level)].map(() => Math.floor(Math.random() * 4));
      pos = 0; state = "show"; showI = 0; showT = performance.now() + 1600;
      setCard(h("span", "c-num", "👀"));
      app.say("¡Mira y escucha!");
    }
    setTimeout(newSeq, 400);
    return {
      drawBack(g, now) { stage(g, app.W, app.H, now, state !== "show"); },
      update(dt, now, body) {
        if (state === "show" && now > showT) {
          if (showI < seq.length) { hit(seq[showI], now); app.sfx.drum(DRUMS[seq[showI]].f); showI++; showT = now + 800; }
          else { state = "play"; setCard(h("span", "c-num", "👉")); app.say("¡Ahora tú!"); }
        }
        const r = Math.max(46, Math.min(app.W, app.H) * 0.1, body.sw * 0.7);
        this.r = r;
        if (state !== "play") return;
        const hands = body.hitters(false);
        drums.forEach((d, i) => {
          const t = touching(hands, d.x, d.y, r);
          if (t && armed[i]) {
            armed[i] = false;
            hit(i, now); app.sfx.drum(d.f);
            if (seq[pos] === i) {
              pos++;
              if (pos >= seq.length) {
                state = "wait";
                win(app, d.x, d.y);
                level = Math.min(5, level + (rounds % 2 === 0 ? 1 : 0));
                setTimeout(newSeq, 2200);
              }
            } else {
              state = "wait"; app.sfx.oops();
              app.say("¡Uy! Era el " + DRUMS[seq[pos]].n + ". ¡Otra vez, mira!");
              setTimeout(() => { pos = 0; state = "show"; showI = 0; showT = performance.now() + 1500; }, 1800);
            }
          }
          if (!t) armed[i] = true;
        });
      },
      drawFront(g, now) {
        const r = this.r || 60;
        drums.forEach((d, i) => {
          const on = lit === i && now < litUntil;
          g.save();
          if (on) { g.shadowColor = d.c; g.shadowBlur = 40; }
          g.fillStyle = "#e8e8f0";
          g.beginPath(); g.ellipse(d.x, d.y + r * 0.35, r, r * 0.5, 0, 0, 7); g.fill();
          g.fillStyle = d.c;
          g.fillRect(d.x - r, d.y, r * 2, r * 0.35);
          g.beginPath(); g.ellipse(d.x, d.y, r, r * 0.5, 0, 0, 7);
          g.fillStyle = on ? "#ffffff" : d.c;
          g.fill();
          g.lineWidth = 6; g.strokeStyle = "#13224a"; g.stroke();
          g.restore();
        });
      },
      repeat() { if (state === "play") { pos = 0; state = "show"; showI = 0; showT = performance.now() + 600; } },
    };
  },
};

// ---------- Portero ----------
export const portero = {
  id: "portero", title: "Portero", icon: "⚽", color: "#26c766", feet: true,
  intro: "¡Eres el portero! Para los balones con las manos o con los pies.",
  create(app) {
    let ball = null, saved = 0, shots = 0, wait = 1500;
    const TOTAL = 10;
    setCard(numberCard(0));
    function shoot(now) {
      if (shots >= TOTAL) return app.finish();
      shots++;
      const a = reach(app, app.body, { feet: true });
      ball = { tx: rand(a.x0, a.x1), ty: rand(a.y0, a.y1), z: 0, start: now, dur: Math.max(1800, 3000 - shots * 80), done: 0 };
      app.sfx.whoosh();
    }
    return {
      drawBack(g, now) {
        orchard(g, app.W, app.H, now);
        // portería
        g.strokeStyle = "#fff"; g.lineWidth = 10;
        g.strokeRect(app.W * 0.05, app.H * 0.08, app.W * 0.9, app.H * 0.9);
        g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2;
        for (let x = app.W * 0.05; x < app.W * 0.95; x += 30) { g.beginPath(); g.moveTo(x, app.H * 0.08); g.lineTo(x, app.H); g.stroke(); }
        for (let y = app.H * 0.08; y < app.H; y += 30) { g.beginPath(); g.moveTo(app.W * 0.05, y); g.lineTo(app.W * 0.95, y); g.stroke(); }
      },
      update(dt, now, body) {
        if (!ball) { wait -= dt; if (wait <= 0) shoot(now); return; }
        if (ball.done) { if (now - ball.done > 1300) { ball = null; wait = 600; } return; }
        ball.z = Math.min(1, (now - ball.start) / ball.dur);
        const cx = app.W / 2, cy = app.H * 0.3;
        ball.x = cx + (ball.tx - cx) * ball.z;
        ball.y = cy + (ball.ty - cy) * ball.z;
        ball.r = (0.15 + ball.z * 0.85) * Math.max(36, body.sw * 0.55);
        if (ball.z > 0.55 && touching(body.hitters(true), ball.x, ball.y, ball.r)) {
          ball.done = now; ball.saved = true; saved++;
          setCard(numberCard(saved));
          win(app, ball.x, ball.y, { card: false, text: pick(["¡Paradón!", "¡Qué parada, Luca!", "¡Muy bien, portero!"]) });
        } else if (ball.z >= 1) {
          ball.done = now; ball.saved = false; app.sfx.oops();
          app.say(pick(["¡Gol! La próxima la paras.", "¡Uy, gol! ¡Atento a la siguiente!"]));
        }
      },
      drawFront(g, now) {
        if (!ball || ball.x == null) return;
        const k = ball.done ? (now - ball.done) / 1300 : 0;
        const x = ball.done && ball.saved ? ball.x + k * 300 * (ball.x > app.W / 2 ? 1 : -1) : ball.x;
        const y = ball.done && ball.saved ? ball.y - k * 300 : ball.y;
        g.save();
        g.globalAlpha = ball.done ? Math.max(0, 1 - k) : 1;
        if (!ball.done) { g.fillStyle = "rgba(0,0,0,.15)"; g.beginPath(); g.ellipse(ball.tx, ball.ty + ball.r, ball.r, ball.r * 0.3, 0, 0, 7); g.fill(); }
        emoji(g, "⚽", x, y, ball.r * 2);
        g.restore();
      },
      repeat() { app.say("¡Para el balón con las manos!"); },
    };
  },
};

// ---------- Limpia la ventana ----------
const PICS = [
  { e: "🦁", n: "un león", s: "¡Grrrr!" }, { e: "🐘", n: "un elefante", s: "¡Tuuuu!" }, { e: "🦒", n: "una jirafa", s: "¡Qué cuello tan largo!" },
  { e: "🐬", n: "un delfín", s: "¡Le encanta nadar!" }, { e: "🦖", n: "un dinosaurio", s: "¡Roaar!" }, { e: "🚒", n: "un camión de bomberos", s: "¡Nino nino!" },
  { e: "🚀", n: "un cohete", s: "¡Tres, dos, uno, despegue!" }, { e: "🐧", n: "un pingüino", s: "¡Qué frío!" },
];
export const ventana = {
  id: "ventana", title: "Ventana", icon: "🪟", color: "#9fd4ff",
  intro: "¡La ventana está sucia! Límpiala moviendo las manos para descubrir qué hay detrás.",
  create(app) {
    const GW = 24, GH = 16;
    let pics = shuffle(PICS).slice(0, 5), idx = -1, grid = null, cleaned = 0, state = "idle", rect = null, mud = null;
    function next() {
      idx++;
      if (idx >= pics.length) return app.finish();
      grid = new Uint8Array(GW * GH); cleaned = 0; state = "clean";
      const a = reach(app, app.body);
      rect = { x: a.x0, y: a.y0, w: a.x1 - a.x0, h: a.y1 - a.y0 };
      mud = [...Array(30)].map(() => ({ x: Math.random(), y: Math.random(), r: 0.06 + Math.random() * 0.08 }));
      setCard(h("span", "c-num", "🧽"));
      app.say(idx === 0 ? "¡Frota, frota con las manos!" : "¡Otra ventana sucia! ¡Frota!");
    }
    setTimeout(next, 400);
    return {
      drawBack(g, now) { room(g, app.W, app.H, now); },
      update(dt, now, body) {
        if (state !== "clean" || !rect) return;
        for (const hd of body.hitters(false)) {
          const gx0 = Math.floor(((hd.x - hd.r * 1.3 - rect.x) / rect.w) * GW), gx1 = Math.ceil(((hd.x + hd.r * 1.3 - rect.x) / rect.w) * GW);
          const gy0 = Math.floor(((hd.y - hd.r * 1.3 - rect.y) / rect.h) * GH), gy1 = Math.ceil(((hd.y + hd.r * 1.3 - rect.y) / rect.h) * GH);
          for (let y = Math.max(0, gy0); y < Math.min(GH, gy1); y++) for (let x = Math.max(0, gx0); x < Math.min(GW, gx1); x++) {
            if (!grid[y * GW + x]) { grid[y * GW + x] = 1; cleaned++; if (cleaned % 12 === 0) app.sfx.tick(2); }
          }
        }
        if (cleaned / (GW * GH) > 0.72) {
          state = "show"; grid.fill(1);
          const p = pics[idx];
          win(app, rect.x + rect.w / 2, rect.y + rect.h / 2, { text: "¡Es " + p.n + "! " + p.s });
          setCard(h("span", "c-num", p.e));
          setTimeout(next, 3200);
        }
      },
      drawFront(g, now) {
        if (!rect) return;
        const p = pics[idx];
        g.save();
        // marco
        g.fillStyle = "#8fd3ff";
        g.fillRect(rect.x, rect.y, rect.w, rect.h);
        if (p) emoji(g, p.e, rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.75);
        // barro donde no se ha limpiado
        const cw = rect.w / GW, ch = rect.h / GH;
        g.fillStyle = "#9b7653";
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (!grid?.[y * GW + x]) g.fillRect(rect.x + x * cw - 0.5, rect.y + y * ch - 0.5, cw + 1, ch + 1);
        g.fillStyle = "#7d5a3a";
        for (const m of mud || []) { const gx = Math.floor(m.x * GW), gy = Math.floor(m.y * GH); if (!grid?.[gy * GW + gx]) { g.beginPath(); g.arc(rect.x + m.x * rect.w, rect.y + m.y * rect.h, m.r * rect.w * 0.5, 0, 7); g.fill(); } }
        g.strokeStyle = "#ffffff"; g.lineWidth = 14;
        g.strokeRect(rect.x, rect.y, rect.w, rect.h);
        g.beginPath(); g.moveTo(rect.x + rect.w / 2, rect.y); g.lineTo(rect.x + rect.w / 2, rect.y + rect.h); g.moveTo(rect.x, rect.y + rect.h / 2); g.lineTo(rect.x + rect.w, rect.y + rect.h / 2);
        g.globalAlpha = state === "show" ? 0 : 0.6; g.lineWidth = 8; g.stroke();
        g.restore();
      },
      avatarOnTop: true,
      avatarAlpha: 0.75,
      repeat() { app.say("¡Frota la ventana con las manos!"); },
    };
  },
};

// ---------- Estírate (estrellas en los extremos) ----------
export const estirate = {
  id: "estirate", title: "Estírate", icon: "🌟", color: "#7a3fb0", feet: true,
  intro: "¡Estírate! Coge las estrellas con las manos o con los pies. ¡Muy arriba, muy abajo y a los lados!",
  create(app) {
    let star = null, got = 0;
    const TOTAL = 12;
    const spots = ["arriba", "izquierda", "derecha", "abajo", "arriba", "izquierda", "derecha", "abajo", "arriba", "derecha", "izquierda", "abajo"];
    const words = { arriba: "¡Muy arriba!", abajo: "¡Abajo, en el suelo! Con el pie.", izquierda: "¡A este lado!", derecha: "¡A este otro lado!" };
    function place(now) {
      if (got >= TOTAL) return app.finish();
      const body = app.body, c = body.center(), sw = body.sw;
      const W = app.W, H = app.H;
      const kind = spots[got];
      let x = W / 2, y = H / 2;
      if (body.mode === "camera" && c) {
        if (kind === "arriba") { x = c.x + rand(-0.6, 0.6) * sw; y = body.p.nose.y - sw * 1.6; }
        if (kind === "abajo") { x = c.x + rand(-1, 1) * sw; y = c.y + sw * 2.4; }
        if (kind === "izquierda") { x = c.x - sw * 2.2; y = c.y - sw * rand(0, 1); }
        if (kind === "derecha") { x = c.x + sw * 2.2; y = c.y - sw * rand(0, 1); }
      } else { x = rand(W * 0.15, W * 0.85); y = rand(H * 0.2, H * 0.75); }
      star = { x: clamp(x, 40, W - 40), y: clamp(y, 60, H - 30), born: now };
      setCard(h("span", "c-num", kind === "arriba" ? "⬆" : kind === "abajo" ? "⬇" : kind === "izquierda" ? "⬅" : "➡"));
      app.say(words[kind]);
    }
    setTimeout(() => place(performance.now()), 500);
    return {
      drawBack(g, now) { magic(g, app.W, app.H, now); },
      update(dt, now, body) {
        if (!star || star.got) return;
        if (touching(body.hitters(true), star.x, star.y, body.sw * 0.55)) {
          star.got = now; got++;
          app.sfx.star(); app.particles.burst(star.x, star.y, 30, 14);
          if (got % 2 === 0) app.star(star.x, star.y);
          app.say(NUMS[Math.min(10, got)] || "¡Bien!");
          setTimeout(() => place(performance.now()), 900);
        }
      },
      drawFront(g, now) {
        if (!star) return;
        const s = (this.s = app.body.sw * 0.55) * (star.got ? 1 + (now - star.got) / 200 : 1 + Math.sin(now / 180) * 0.12);
        g.save();
        g.globalAlpha = star.got ? Math.max(0, 1 - (now - star.got) / 500) : 1;
        g.shadowColor = "#ffc93c"; g.shadowBlur = 30;
        g.fillStyle = "#ffc93c"; g.strokeStyle = "#fff"; g.lineWidth = 5;
        starPath(g, star.x, star.y, s); g.stroke();
        g.restore();
      },
      repeat() { if (star && !star.got) app.say(words[spots[got]]); },
    };
  },
};
