// Carrera en la selva: salta los troncos, agáchate bajo las ramas y estira los brazos para coger estrellas.
import { jungle } from "../scene.js";
import { NUMS, PRAISE, pick } from "../voice.js";
import { setCard, actionCard, starsCard } from "../hud.js";
import { starPath } from "../particles.js";

const TOTAL = 12;

export default {
  id: "selva",
  title: "Selva",
  icon: "🌴",
  color: "#3ccf7a",
  needsBody: true,
  intro: "¡Carrera en la selva! Si viene un tronco, salta. Si viene una rama, agáchate.",
  create(app) {
    let scroll = 0, obs = null, done = 0, jumpsOk = 0, stars = [], spawnWait = 1500, lastKind = null;

    function bodyX(body) { const c = body.center(); return c ? c.x : app.W / 2; }
    function groundY(body) {
      const p = body.p;
      if (body.mode === "camera" && p && p.la.v > 0.5 && p.ra.v > 0.5) return Math.min(app.H * 0.98, Math.max(p.la.y, p.ra.y) + body.sw * 0.2);
      if (body.mode === "camera" && body.base) return Math.min(app.H * 0.98, body.base.hipY + body.torso * 1.9);
      return app.H * 0.87;
    }

    function spawn(now) {
      if (done >= TOTAL) return app.finish();
      let kind = Math.random() < 0.6 ? "tronco" : "rama";
      if (kind === lastKind && Math.random() < 0.5) kind = kind === "tronco" ? "rama" : "tronco";
      lastKind = kind;
      obs = { kind, x: app.W + 120, state: "come", armedAt: now, waitStart: 0, nagged: 0 };
      if (kind === "tronco") { setCard(actionCard("⬆", "up")); app.say("¡Viene un tronco! ¡Salta!"); }
      else { setCard(actionCard("⬇", "down")); app.say("¡Una rama! ¡Agáchate!"); }
      // estrella bonus de vez en cuando
      if (done % 3 === 1) stars.push({ x: app.W + 520, got: 0 });
    }

    function pass(now, ok) {
      obs.state = "go";
      done++;
      if (ok) {
        app.sfx.good();
        app.star(bodyX(app.body), app.H * 0.4);
        app.happy();
        if (obs.kind === "tronco") { jumpsOk++; app.say(NUMS[Math.min(10, jumpsOk)] + "! " + pick(PRAISE)); }
        else app.say(pick(PRAISE));
        setCard(starsCard(1));
      } else {
        app.say("¡Casi! El siguiente lo haces.");
        setCard();
      }
      spawnWait = 1600;
    }

    return {
      drawBack(g, now) { jungle(g, app.W, app.H, now, scroll); },
      update(dt, now, body) {
        const bx = bodyX(body), sw = body.sw;
        const moving = !obs || obs.state !== "wait";
        if (moving) scroll += dt * 0.25;
        if (!obs) {
          spawnWait -= dt;
          if (spawnWait <= 0) spawn(now);
        } else {
          const stopX = bx + sw * 1.6;
          if (obs.state === "come") {
            obs.x -= dt * app.W * 0.00028;
            if (obs.x <= stopX) { obs.x = stopX; obs.state = "wait"; obs.waitStart = now; }
          }
          if (obs.state === "come" || obs.state === "wait") {
            const near = obs.x < bx + sw * 3.5;
            const did = obs.kind === "tronco" ? body.lastJump > obs.armedAt + 300 : body.lastDuck > obs.armedAt + 300;
            if (near && did) { app.sfx.jump(); pass(now, true); }
            else if (obs.state === "wait") {
              const w = now - obs.waitStart;
              if (w > 5000 && obs.nagged < 1) { obs.nagged = 1; app.say(obs.kind === "tronco" ? "¡Salta muy alto, como una rana!" : "¡Hazte pequeñito, agáchate!"); }
              if (w > 11000) pass(now, false);
            }
          }
          if (obs.state === "go") {
            obs.x -= dt * app.W * 0.0009;
            if (obs.x < -200) obs = null;
          }
        }
        // estrellas para coger con las manos arriba
        const hands = body.hitters(false);
        for (const s of stars) {
          if (moving) s.x -= dt * app.W * 0.00028;
          s.y = (body.p && body.mode === "camera" ? body.p.nose.y - sw * 1.2 : app.H * 0.25);
          if (!s.got) for (const hd of hands) if (Math.hypot(hd.x - s.x, hd.y - s.y) < hd.r + sw * 0.6) { s.got = now; app.sfx.star(); app.star(s.x, s.y); }
        }
        stars = stars.filter((s) => s.x > -100 && (!s.got || now - s.got < 500));
        this.gy = groundY(body);
        this.sw = sw;
        this.headY = body.p ? body.p.nose.y : app.H * 0.3;
      },
      draw(g, now) {
        const sw = this.sw || 80, gy = this.gy || app.H * 0.9;
        if (obs) {
          g.save();
          if (obs.kind === "tronco") {
            const w = sw * 1.4, h = sw * 0.75;
            const y = gy - h;
            g.fillStyle = "#8a5a33";
            g.beginPath(); g.roundRect(obs.x - w / 2, y, w, h, h / 2); g.fill();
            g.fillStyle = "#c98f4f";
            g.beginPath(); g.ellipse(obs.x + w / 2 - h * 0.3, y + h / 2, h * 0.3, h * 0.48, 0, 0, 7); g.fill();
            g.strokeStyle = "#8a5a33"; g.lineWidth = 3;
            g.beginPath(); g.ellipse(obs.x + w / 2 - h * 0.3, y + h / 2, h * 0.15, h * 0.25, 0, 0, 7); g.stroke();
          } else {
            const y = (this.headY || app.H * 0.3) - sw * 0.3;
            g.strokeStyle = "#6b4a2b"; g.lineWidth = sw * 0.35; g.lineCap = "round";
            g.beginPath(); g.moveTo(obs.x - sw * 0.2, -10); g.lineTo(obs.x, y); g.lineTo(obs.x + sw * 1.4, y + sw * 0.1); g.stroke();
            g.fillStyle = "#2f9e4f";
            for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(obs.x + i * sw * 0.32, y + sw * 0.25 + (i % 2) * 8, sw * 0.28, sw * 0.14, 0.5, 0, 7); g.fill(); }
          }
          // flecha grande que indica qué hacer
          if (obs.state !== "go") {
            const ay = obs.kind === "tronco" ? gy - sw * 2.4 : (this.headY || app.H * 0.3) + sw * 0.8;
            const bob = Math.sin(now / 150) * 10;
            g.fillStyle = obs.kind === "tronco" ? "#ffc93c" : "#ff5d8f";
            g.strokeStyle = "#13224a"; g.lineWidth = 5;
            g.beginPath();
            const s = sw * 0.6, cx = obs.x, cy = ay + bob, d = obs.kind === "tronco" ? -1 : 1;
            g.moveTo(cx, cy + d * s); g.lineTo(cx + s, cy); g.lineTo(cx + s * 0.4, cy); g.lineTo(cx + s * 0.4, cy - d * s);
            g.lineTo(cx - s * 0.4, cy - d * s); g.lineTo(cx - s * 0.4, cy); g.lineTo(cx - s, cy); g.closePath();
            g.fill(); g.stroke();
          }
          g.restore();
        }
        for (const s of stars) {
          g.save();
          g.fillStyle = "#ffc93c";
          g.strokeStyle = "#fff";
          g.lineWidth = 4;
          const k = s.got ? 1 + (now - s.got) / 200 : 1 + Math.sin(now / 200) * 0.1;
          g.globalAlpha = s.got ? Math.max(0, 1 - (now - s.got) / 500) : 1;
          starPath(g, s.x, s.y, sw * 0.5 * k);
          g.stroke();
          g.restore();
        }
      },
      repeat() { if (obs && obs.state !== "go") app.say(obs.kind === "tronco" ? "¡Salta!" : "¡Agáchate!"); },
      touchActions: ["jump", "duck"],
    };
  },
};
