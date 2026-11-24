// Juegos de cuerpo entero: Luca dice, estatuas, baile, ranita, vuela, esquiva y esquí.
import { touching, emoji, win, rand, pick, shuffle, clamp, canvasCard, text } from "../kit.js";
import { stage, pond, skyfly, snow, magic } from "../scene.js";
import { NUMS, PRAISE } from "../voice.js";
import { setCard, poseCard, actionCard, numberCard, fruitCard, colorCard, h } from "../hud.js";
import { skeleton } from "../body.js";
import { drawGhost } from "../avatar.js";
import { starPath } from "../particles.js";

// ---------- Luca dice ----------
const ORDERS = [
  { id: "cabeza", say: "¡Tócate la cabeza!", part: "nose" },
  { id: "barriga", say: "¡Tócate la barriga!", part: "belly" },
  { id: "arbol", say: "¡Brazos arriba!" },
  { id: "palmada", say: "¡Da una palmada!" },
  { id: "rodillas", say: "¡Tócate las rodillas!", part: "knee" },
  { id: "salta", say: "¡Salta!" },
  { id: "saludo", say: "¡Levanta una mano!" },
  { id: "pelota", say: "¡Agáchate!" },
  { id: "cintura", say: "¡Manos en la cintura!" },
  { id: "avion", say: "¡Abre los brazos como un avión!" },
];
export const lucadice = {
  id: "lucadice", title: "Luca dice", icon: "🙋", color: "#ff9f43", needsBody: true,
  intro: "¡Luca dice! Haz lo que yo te diga, rápido.",
  create(app) {
    const list = shuffle(ORDERS).concat(shuffle(ORDERS)).slice(0, 12);
    let i = -1, cur = null, held = 0, t0 = 0, state = "idle", nag = 0;
    function next() {
      i++;
      if (i >= list.length) return app.finish();
      cur = list[i]; held = 0; t0 = performance.now(); state = "go"; nag = 0;
      setCard(cur.id === "salta" ? actionCard("⬆", "up") : poseCard(cur.id));
      app.say(cur.say);
    }
    setTimeout(next, 400);
    function doing(body) {
      if (body.mode === "touch") {
        if (cur.id === "salta") return body.jumping;
        if (cur.id === "pelota") return body.ducking;
        const p = body.p, c = body.center();
        const at = cur.part === "nose" ? p.nose : cur.part === "belly" ? c : cur.part === "knee" ? p.lk : null;
        return at ? body.touches.some((t) => Math.hypot(t.x - at.x, t.y - at.y) < body.sw * 0.9) : body.touches.length > 0;
      }
      if (cur.id === "salta") return body.lastJump > t0;
      return body.matches(cur.id);
    }
    return {
      drawBack(g, now) { stage(g, app.W, app.H, now); },
      update(dt, now, body) {
        if (state !== "go") return;
        held = doing(body) ? held + dt : Math.max(0, held - dt);
        if (held > (cur.id === "salta" ? 0 : 450)) {
          state = "ok";
          const c = body.center() || { x: app.W / 2, y: app.H / 2 };
          win(app, c.x, c.y - body.sw);
          setTimeout(next, 1700);
        } else if (now - t0 > 7000 && nag === 0) { nag = 1; app.say("Mira el dibujo. " + cur.say); }
        else if (now - t0 > 16000) { state = "ok"; app.say("¡Vamos con otra!"); setTimeout(next, 1200); }
        this.body = body;
      },
      drawFront(g, now) {
        const body = this.body;
        if (!body || !cur || state !== "go" || body.mode !== "touch" || !cur.part) return;
        const p = body.p, at = cur.part === "nose" ? p.nose : cur.part === "belly" ? body.center() : p.lk;
        g.save(); g.strokeStyle = "#ffc93c"; g.lineWidth = 8; g.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(now / 200));
        g.beginPath(); g.arc(at.x, at.y, body.sw * 0.7, 0, 7); g.stroke(); g.restore();
      },
      repeat() { if (cur && state === "go") app.say(cur.say); },
      touchActions: ["jump", "duck"],
    };
  },
};

// ---------- Estatuas ----------
export const estatuas = {
  id: "estatuas", title: "Estatuas", icon: "🗿", color: "#b8324f", needsBody: true, quiet: true,
  intro: "¡Las estatuas! Cuando suene la música, baila. Cuando pare, ¡quieto como una estatua!",
  create(app) {
    let round = 0, phase = "idle", until = 0, moved = 0, still = 0;
    const TOTAL = 6;
    function dance() {
      if (round >= TOTAL) { app.music(false); return app.finish(); }
      round++;
      phase = "dance"; until = performance.now() + rand(4000, 7500);
      app.music(true);
      setCard(h("span", "c-num", "💃"));
      app.say(pick(["¡A bailar!", "¡Baila, baila!", "¡Música!"]));
    }
    function freeze() {
      phase = "freeze"; until = performance.now() + 3000; moved = 0; still = 0;
      app.music(false);
      setCard(h("span", "c-num", "🗿"));
      app.say("¡Estatua!");
    }
    setTimeout(dance, 400);
    return {
      drawBack(g, now) { stage(g, app.W, app.H, now, phase === "dance"); },
      update(dt, now, body) {
        if (phase === "dance") {
          if (now > until) freeze();
        } else if (phase === "freeze") {
          if (now - (until - 3000) > 900) { // margen para pararse
            if (body.motion > 0.05) moved += dt; else still += dt;
          }
          if (moved > 350) {
            phase = "wait"; app.sfx.oops();
            app.say(pick(["¡Te has movido! ¡Ja, ja!", "¡Uy, se ha movido la estatua!"]));
            setTimeout(dance, 2000);
          } else if (now > until) {
            phase = "wait";
            const c = body.center() || { x: app.W / 2, y: app.H / 2 };
            win(app, c.x, c.y - body.sw, { text: pick(["¡Qué buena estatua!", "¡Ni te has movido! ¡Genial!"]) });
            setTimeout(dance, 2000);
          }
        }
      },
      drawFront(g, now) {
        if (phase === "freeze") {
          const left = Math.max(0, (until - now) / 3000);
          g.save(); g.fillStyle = "rgba(255,255,255,.85)";
          g.beginPath(); g.moveTo(app.W / 2, app.H * 0.2); g.arc(app.W / 2, app.H * 0.2, 40, -Math.PI / 2, -Math.PI / 2 + left * 6.283); g.fill(); g.restore();
        }
      },
      repeat() { app.say(phase === "freeze" ? "¡Quieto como una estatua!" : "¡Baila!"); },
    };
  },
};

// ---------- Baila conmigo ----------
const DANCE = ["arbol", "avion", "cintura", "estrella", "saludo", "cabeza", "palmada", "pelota"];
const DANCE_SAY = { arbol: "¡Arriba!", avion: "¡Avión!", cintura: "¡Cintura!", estrella: "¡Estrella!", saludo: "¡Hola!", cabeza: "¡Cabeza!", palmada: "¡Palmada!", pelota: "¡Abajo!" };
export const baila = {
  id: "baila", title: "Baila", icon: "🕺", color: "#ff5d8f", needsBody: true,
  intro: "¡Baila conmigo! Copia los pasos de baile al ritmo de la música.",
  create(app) {
    const steps = [];
    for (let k = 0; k < 14; k++) steps.push(DANCE[(k < 6 ? k % 4 : Math.floor(Math.random() * DANCE.length))]);
    let i = -1, cur = null, t0 = 0, hit = false, score = 0;
    const BEAT = 2600;
    function next() {
      i++;
      if (i >= steps.length) return app.finish();
      cur = steps[i]; t0 = performance.now(); hit = false;
      setCard(poseCard(cur));
      app.say(DANCE_SAY[cur]);
    }
    setTimeout(next, 600);
    return {
      drawBack(g, now) { stage(g, app.W, app.H, now, true); },
      update(dt, now, body) {
        if (!cur) return;
        if (!hit && (body.mode === "touch" ? body.touches.length > 0 : body.matches(cur))) {
          hit = true; score++;
          app.sfx.star();
          const c = body.center() || { x: app.W / 2, y: app.H / 2 };
          app.particles.burst(c.x, c.y - body.sw, 24, 12);
          if (score % 2 === 0) app.star(c.x, c.y - body.sw * 2);
        }
        if (now - t0 > BEAT) next();
        this.body = body;
      },
      drawFront(g, now) {
        const body = this.body;
        if (!cur || !body || hit) return;
        const c = body.center();
        const cx = c ? c.x : app.W / 2;
        const hipY = body.mode === "camera" && body.p ? (body.p.lh.y + body.p.rh.y) / 2 : app.H * 0.86 - body.sw * 2.1;
        drawGhost(g, skeleton(cx, hipY, body.sw, cur), now, "#ffc93c");
        // barra de tiempo
        const k = 1 - (now - t0) / BEAT;
        g.fillStyle = "rgba(255,255,255,.8)";
        g.fillRect(app.W * 0.3, app.H - 14, app.W * 0.4 * Math.max(0, k), 8);
      },
      repeat() { if (cur) app.say(DANCE_SAY[cur]); },
    };
  },
};

// ---------- Ranita saltarina (contar saltos) ----------
export const ranita = {
  id: "ranita", title: "Ranita", icon: "🐸", color: "#26c766", needsBody: true,
  intro: "¡La ranita quiere cruzar el estanque! Cada vez que saltes, la rana salta a otra hoja.",
  create(app) {
    const ROUNDS = [2, 3, 4, 3, 5];
    let r = -1, need = 0, done = 0, frogI = 0, hopT = 0, lastJ = 0, state = "idle";
    function next() {
      r++;
      if (r >= ROUNDS.length) return app.finish();
      need = ROUNDS[r]; done = 0; frogI = 0; state = "go"; lastJ = app.body.lastJump;
      setCard(fruitCard("🪷", need, 0));
      app.say("¡Salta " + NUMS[need] + " veces!");
    }
    setTimeout(next, 500);
    return {
      drawBack(g, now) { pond(g, app.W, app.H, now); },
      update(dt, now, body) {
        if (state !== "go") return;
        if (body.lastJump > lastJ) {
          lastJ = body.lastJump;
          done++; frogI = done; hopT = now;
          app.sfx.jump();
          setCard(fruitCard("🪷", need, done));
          if (done >= need) {
            state = "ok";
            setTimeout(() => win(app, app.W * 0.85, app.H * 0.6, { text: NUMS[done] + ". ¡La rana ha llegado! " + pick(PRAISE) }), 500);
            setTimeout(next, 3000);
          } else app.say(NUMS[done] + "!");
        }
        this.now = now;
      },
      drawFront(g, now) {
        if (!need) return;
        const W = app.W, H = app.H, y = H * 0.68;
        const n = need + 1;
        const px = (k) => W * 0.12 + (W * 0.76 * k) / need;
        for (let k = 0; k <= need; k++) {
          g.fillStyle = k === need ? "#ff7ac3" : "#3cb85c";
          g.beginPath(); g.ellipse(px(k), y, W * 0.05, H * 0.03, 0, 0, 7); g.fill();
          if (k === need) emoji(g, "🌸", px(k), y - 10, H * 0.06);
        }
        void n;
        const t = Math.min(1, (now - hopT) / 450);
        const x = px(frogI - 1 + t), arc = Math.sin(t * Math.PI) * H * 0.15;
        const fx = frogI === 0 ? px(0) : x, fy = (frogI === 0 ? y : y - arc) - H * 0.04;
        emoji(g, "🐸", fx, fy, H * 0.1);
      },
      avatarAlpha: 0.55,
      repeat() { if (state === "go") app.say("¡Salta " + NUMS[need - done] + (need - done === 1 ? " vez más!" : " veces más!")); },
      touchActions: ["jump"],
    };
  },
};

// ---------- Vuela pajarito ----------
export const vuela = {
  id: "vuela", title: "Vuela", icon: "🐦", color: "#5ab8ff", needsBody: true, hideAvatar: true,
  intro: "¡Vuela, pajarito! Mueve los brazos arriba y abajo como alas para volar y coger las estrellas.",
  create(app) {
    let y = app.H * 0.6, vy = 0, scroll = 0, stars = [], got = 0, t = 0, spawn = 1500, lastTaps = app.body.taps;
    const DURATION = 45000;
    setCard(numberCard(0));
    return {
      drawBack(g, now) { skyfly(g, app.W, app.H, now, scroll); },
      update(dt, now, body) {
        t += dt; scroll += dt * 0.15;
        let lift = body.mode === "touch" ? 0 : body.flap * 2.2;
        if (body.mode === "touch" && body.taps > lastTaps) { vy = -0.55; lastTaps = body.taps; }
        vy += (0.0009 - lift * 0.01) * dt;
        vy = clamp(vy, -0.6, 0.35);
        y = clamp(y + vy * dt, app.H * 0.1, app.H * 0.85);
        if (y >= app.H * 0.85) vy = 0;
        spawn -= dt;
        if (spawn <= 0 && t < DURATION) { spawn = rand(1300, 2000); stars.push({ x: app.W + 40, y: rand(app.H * 0.15, app.H * 0.75) }); }
        const bx = app.W * 0.28;
        for (const s of stars) {
          s.x -= dt * app.W * 0.00022;
          if (!s.got && Math.hypot(s.x - bx, s.y - y) < app.H * 0.09) {
            s.got = now; got++; app.sfx.star(); app.particles.burst(s.x, s.y, 16, 10);
            setCard(numberCard(got));
            if (got <= 10) app.say(NUMS[got] + "!");
            if (got % 3 === 0) app.star(s.x, s.y);
          }
        }
        stars = stars.filter((s) => s.x > -50 && (!s.got || now - s.got < 300));
        if (t > DURATION && !stars.length) app.finish();
        if (t > 3000 && t < 3100 && got === 0) app.say(body.mode === "touch" ? "¡Toca la pantalla para volar!" : "¡Mueve los brazos como alas!");
        this.y = y; this.wing = Math.sin(now / (lift > 0.02 || vy < 0 ? 60 : 200));
      },
      drawFront(g, now) {
        const bx = app.W * 0.28, by = this.y || app.H / 2, s = app.H * 0.06;
        for (const st of stars) { g.fillStyle = "#ffc93c"; g.strokeStyle = "#fff"; g.lineWidth = 4; starPath(g, st.x, st.y, s * 0.8); g.stroke(); }
        // pájaro dibujado
        g.save(); g.translate(bx, by);
        g.fillStyle = "#ff5d8f";
        g.beginPath(); g.ellipse(0, 0, s * 1.2, s * 0.9, 0, 0, 7); g.fill();
        g.fillStyle = "#ff9fc0";
        g.beginPath(); g.ellipse(-s * 0.2, -s * 0.1 - this.wing * s * 0.5, s * 0.8, s * 0.35, -0.4 - this.wing * 0.6, 0, 7); g.fill();
        g.fillStyle = "#fff"; g.beginPath(); g.arc(s * 0.55, -s * 0.3, s * 0.28, 0, 7); g.fill();
        g.fillStyle = "#13224a"; g.beginPath(); g.arc(s * 0.62, -s * 0.3, s * 0.13, 0, 7); g.fill();
        g.fillStyle = "#ffc93c"; g.beginPath(); g.moveTo(s * 1.1, -s * 0.1); g.lineTo(s * 1.6, s * 0.05); g.lineTo(s * 1.1, s * 0.25); g.fill();
        g.restore();
      },
      repeat() { app.say(app.body.mode === "touch" ? "¡Toca la pantalla para volar!" : "¡Mueve los brazos como alas!"); },
    };
  },
};

// ---------- Esquiva las bolas de nieve ----------
export const esquiva = {
  id: "esquiva", title: "Esquiva", icon: "☃️", color: "#9fd4ff", needsBody: true, touchFollow: true,
  intro: "¡Bolas de nieve! Muévete a un lado o al otro para que no te den.",
  create(app) {
    let balls = [], spawn = 1500, thrown = 0, dodged = 0;
    const TOTAL = 18;
    setCard(numberCard(0));
    return {
      drawBack(g, now) { snow(g, app.W, app.H, now, 0); },
      update(dt, now, body) {
        spawn -= dt;
        const c = body.center() || { x: app.W / 2, y: app.H / 2 };
        if (spawn <= 0 && thrown < TOTAL) {
          thrown++; spawn = rand(1500, 2300);
          // apunta cerca de Luca para que tenga que moverse
          const x = clamp(c.x + rand(-0.6, 0.6) * body.sw, 40, app.W - 40);
          balls.push({ x, y: -40, vy: app.H / 2600, r: Math.max(28, body.sw * 0.5), warned: 0 });
        }
        const head = body.p?.nose || c;
        for (const b of balls) {
          b.y += b.vy * dt;
          if (!b.warned && b.y > app.H * 0.05) { b.warned = 1; app.sfx.whoosh(); }
          if (!b.done && b.y > head.y - body.sw * 0.5) {
            b.done = 1;
            const hitBody = Math.abs(b.x - c.x) < body.sw * 0.8 + b.r * 0.5;
            if (hitBody) { b.hit = now; app.sfx.oops(); app.say(pick(["¡Plaf! ¡Te dio!", "¡Uy, nieve en la cabeza!"])); }
            else { dodged++; setCard(numberCard(dodged)); app.sfx.star(); if (dodged % 3 === 0) app.star(b.x, b.y); }
          }
        }
        balls = balls.filter((b) => b.y < app.H + 60 && (!b.hit || now - b.hit < 400));
        if (thrown >= TOTAL && !balls.length) app.finish();
      },
      drawFront(g, now) {
        for (const b of balls) {
          if (!b.done) { g.fillStyle = "rgba(0,0,0,.12)"; g.beginPath(); g.ellipse(b.x, app.H * 0.9, b.r, b.r * 0.25, 0, 0, 7); g.fill(); }
          g.fillStyle = "#fff"; g.strokeStyle = "#9fc4e0"; g.lineWidth = 4;
          g.beginPath(); g.arc(b.x, b.y, b.hit ? b.r * (1 + (now - b.hit) / 200) : b.r, 0, 7); g.fill(); g.stroke();
        }
      },
      repeat() { app.say("¡Muévete para que no te den las bolas de nieve!"); },
    };
  },
};

// ---------- Esquí: pasa por la puerta del color ----------
const GATES = [{ c: "#ff3b3b", n: "roja" }, { c: "#2b7bff", n: "azul" }, { c: "#ffd31a", n: "amarilla" }, { c: "#26c766", n: "verde" }];
export const esqui = {
  id: "esqui", title: "Esquí", icon: "⛷️", color: "#eaf6ff", needsBody: true, touchFollow: true,
  intro: "¡A esquiar! Muévete hacia los lados para pasar por la puerta del color que te diga.",
  create(app) {
    let row = null, rows = 0, scroll = 0, wait = 1200;
    const TOTAL = 10;
    function spawn(body) {
      if (rows >= TOTAL) return app.finish();
      rows++;
      const c = body.center() || { x: app.W / 2 };
      const span = body.mode === "touch" ? app.W * 0.3 : Math.max(body.sw * 2.2, app.W * 0.18);
      const pair = shuffle(GATES).slice(0, 2);
      const target = pick(pair);
      const mid = clamp(c.x, span, app.W - span);
      row = { y: app.H + 60, gates: [{ ...pair[0], x: mid - span * 0.75 }, { ...pair[1], x: mid + span * 0.75 }], target, w: span * 0.9 };
      setCard(colorCard(target.c));
      app.say("¡Pasa por la puerta " + target.n + "!");
    }
    return {
      drawBack(g, now) { snow(g, app.W, app.H, now, scroll); },
      update(dt, now, body) {
        scroll += dt * 0.2;
        if (!row) { wait -= dt; if (wait <= 0) spawn(body); return; }
        const c = body.center() || { x: app.W / 2, y: app.H * 0.6 };
        const lineY = body.mode === "camera" && body.p ? (body.p.lh.y + body.p.rh.y) / 2 : app.H * 0.86 - body.sw * 2.1;
        row.y -= dt * app.H * 0.00018;
        if (!row.done && row.y <= lineY) {
          row.done = now;
          const gate = row.gates.find((gt) => Math.abs(c.x - gt.x) < row.w / 2);
          if (gate === undefined) { app.sfx.oops(); app.say("¡Casi! Tenías que pasar por la " + row.target.n + "."); }
          else if (gate.n === row.target.n) win(app, gate.x, lineY - body.sw, { text: "¡Por la " + gate.n + "! " + pick(PRAISE) });
          else { app.sfx.oops(); app.say("Esa es la " + gate.n + ". ¡La próxima!"); }
        }
        if (row.y < -100) { row = null; wait = 500; }
      },
      drawFront(g, now) {
        if (!row) return;
        for (const gt of row.gates) {
          const x0 = gt.x - row.w / 2, x1 = gt.x + row.w / 2, y = row.y, hgt = app.H * 0.18;
          g.fillStyle = gt.c;
          g.fillRect(x0 - 6, y - hgt, 12, hgt); g.fillRect(x1 - 6, y - hgt, 12, hgt);
          g.beginPath(); g.moveTo(x0 + 6, y - hgt); g.lineTo(x0 + 50, y - hgt + 18); g.lineTo(x0 + 6, y - hgt + 36); g.fill();
          g.beginPath(); g.moveTo(x1 - 6, y - hgt); g.lineTo(x1 - 50, y - hgt + 18); g.lineTo(x1 - 6, y - hgt + 36); g.fill();
          g.globalAlpha = 0.25; g.fillRect(x0, y - 6, x1 - x0, 12); g.globalAlpha = 1;
        }
      },
      repeat() { if (row) app.say("¡Pasa por la puerta " + row.target.n + "!"); },
    };
  },
};
