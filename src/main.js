import { Tracker } from "./pose.js";
import { Body, skeleton } from "./body.js";
import { say, setMuted, pick } from "./voice.js";
import * as sfx from "./sfx.js";
import { drawAvatar, CHARACTERS } from "./avatar.js";
import { Particles } from "./particles.js";
import { setCard, h } from "./hud.js";
import { menuBg } from "./scene.js";
import bubbles from "./games/bubbles.js";
import fruits from "./games/fruits.js";
import runner from "./games/runner.js";
import wall from "./games/wall.js";
import { formas, animales, cuenta, dados, nombre } from "./games/picks.js";
import { topos, tambores, portero, ventana, estirate } from "./games/arcade.js";
import { lucadice, estatuas, baila, ranita, vuela, esquiva, esqui } from "./games/moves.js";

// ordenados de más tranquilos (aprender tocando) a más movidos (todo el cuerpo)
const GAMES = [
  bubbles, formas, animales, cuenta, dados, nombre, fruits,
  topos, tambores, ventana, estirate, portero,
  lucadice, baila, estatuas, runner, ranita, vuela, esquiva, esqui, wall,
];
const $ = (id) => document.getElementById(id);

// ---------- guardado ----------
const store = { stars: 0, char: "dino", mode: "camera", sound: true, view: "avatar" };
try { Object.assign(store, JSON.parse(localStorage.getItem("luca-move") || "{}")); } catch (e) {}
const save = () => { try { localStorage.setItem("luca-move", JSON.stringify(store)); } catch (e) {} };
const charObj = () => CHARACTERS.find((c) => c.id === store.char) || CHARACTERS[0];
const showStars = () => document.querySelectorAll(".starCount").forEach((e) => (e.textContent = store.stars));

// ---------- canvas ----------
const cv = $("cv"), g = cv.getContext("2d");
let W = 0, H = 0, dpr = 1;
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// ---------- estado ----------
const tracker = new Tracker($("video"));
const body = new Body();
const particles = new Particles();
const touchAct = { jumpAt: -1e9, duckAt: -1e9, pose: null };
let phase = "menu"; // menu | loading | calib | play | results
let lastCalibAt = -1e9, calibNeed = 1200;
let gameDef = null, game = null, earned = 0, calibOk = 0, lostSince = 0, happyUntil = 0, lastNag = 0, startedAt = 0;

const app = {
  get W() { return W; }, get H() { return H; },
  body, particles, sfx,
  say: (t) => say(t),
  star(x, y) {
    earned++; store.stars++; save(); showStars();
    sfx.star();
    particles.burst(x, y, 20, 14);
  },
  happy() { happyUntil = performance.now() + 1500; },
  music(on) { sfx.music(on); },
  finish() { endGame(); },
};

// ---------- menú ----------
function buildMenu() {
  const gamesEl = $("games");
  gamesEl.replaceChildren();
  for (const gd of GAMES) {
    const b = h("button", "game");
    b.style.background = gd.color;
    b.append(h("span", "gi", gd.icon), h("span", null, gd.title));
    if (gd.needsBody) b.append(h("span", "cam", "🏃"));
    b.setAttribute("aria-label", gd.title);
    b.onclick = () => startGame(gd);
    gamesEl.append(b);
  }
  const pickEl = $("charPick");
  pickEl.replaceChildren();
  const icons = { dino: "🦖", robot: "🤖", astro: "🚀", hero: "🦸" };
  for (const c of CHARACTERS) {
    const b = h("button", null, icons[c.id]);
    const locked = store.stars < c.need;
    b.disabled = locked;
    b.setAttribute("aria-pressed", String(store.char === c.id));
    b.setAttribute("aria-label", c.name);
    if (locked) b.append(h("span", "lock", c.need + "★"));
    b.onclick = () => { sfx.unlock(); store.char = c.id; save(); buildMenu(); sfx.pop(); say("¡" + c.name + "!"); };
    pickEl.append(b);
  }
  $("modeBtn").textContent = store.mode === "camera" ? "📷 Cámara" : "👆 Con el dedo";
  $("viewBtn").textContent = store.view === "mirror" ? "🪞 Espejo" : "🦖 Muñeco";
  $("viewBtn").hidden = store.mode !== "camera";
  $("soundBtn").textContent = store.sound ? "🔊" : "🔇";
  $("soundBtn").setAttribute("aria-pressed", String(store.sound));
  showStars();
}

function drawCharPreview(canvas, ch, t) {
  const c = canvas.getContext("2d");
  c.clearRect(0, 0, canvas.width, canvas.height);
  const sw = canvas.width * 0.2;
  const wave = Math.sin(t / 300);
  const p = skeleton(canvas.width / 2, canvas.height * 0.88 - sw * 2.1, sw, "stand");
  // saluda con la mano
  p.re = { x: p.rs.x + sw * 0.75, y: p.rs.y - sw * 0.5, v: 1 };
  p.rw = { x: p.re.x + sw * 0.2 + wave * sw * 0.25, y: p.re.y - sw * 0.6, v: 1 };
  drawAvatar(c, p, ch, t, { happy: true });
}

$("modeBtn").onclick = () => { sfx.unlock(); store.mode = store.mode === "camera" ? "touch" : "camera"; save(); buildMenu(); say(store.mode === "camera" ? "Jugar con la cámara" : "Jugar con el dedo"); };
$("viewBtn").onclick = () => {
  sfx.unlock();
  store.view = store.view === "mirror" ? "avatar" : "mirror"; save(); buildMenu();
  say(store.view === "mirror" ? "¡Te verás a ti mismo en la pantalla!" : "¡Serás un muñeco!");
};
$("soundBtn").onclick = () => { store.sound = !store.sound; save(); sfx.setSound(store.sound); setMuted(!store.sound); buildMenu(); };
$("fsBtn").onclick = async () => {
  try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else await document.exitFullscreen(); } catch (e) {}
  try { await screen.orientation.lock("landscape"); } catch (e) {}
};
$("helpBtn").onclick = () => { $("help").hidden = false; };
$("helpClose").onclick = () => { $("help").hidden = true; };
$("homeBtn").onclick = () => { stopGame(); toMenu(); };
$("menuBtn").onclick = () => toMenu();
$("againBtn").onclick = () => gameDef && startGame(gameDef);
$("repeatBtn").onclick = () => {
  if (phase === "calib") nagCalib(performance.now(), true);
  else game?.repeat?.();
};
$("jumpBtn").onclick = () => { touchAct.jumpAt = performance.now(); sfx.jump(); };
$("duckBtn").onclick = () => { touchAct.duckAt = performance.now(); sfx.whoosh(); };
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp" || e.key === " ") touchAct.jumpAt = performance.now();
  if (e.key === "ArrowDown") touchAct.duckAt = performance.now();
});

// dedos en pantalla (modo táctil)
const pointers = new Map();
cv.addEventListener("pointerdown", (e) => { sfx.unlock(); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); body.taps++; touchAct.followX = e.clientX; });
cv.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  touchAct.moveAt = performance.now();
  touchAct.followX = e.clientX;
});
const up = (e) => pointers.delete(e.pointerId);
cv.addEventListener("pointerup", up);
cv.addEventListener("pointercancel", up);

function show(id) {
  for (const s of ["menu", "play", "loading", "results"]) $(s).hidden = s !== id;
}

function toMenu() {
  phase = "menu";
  sfx.music(false);
  show("menu");
  buildMenu();
}

let wakeLock = null;
async function keepAwake() { try { wakeLock = await navigator.wakeLock?.request("screen"); } catch (e) {} }

// ---------- arrancar un juego ----------
async function startGame(gd) {
  sfx.unlock();
  sfx.setSound(store.sound);
  setMuted(!store.sound);
  keepAwake();
  gameDef = gd;
  game = null;
  earned = 0;
  particles.list = [];
  setCard();
  if (store.mode === "camera" && !tracker.ready) {
    show("loading");
    phase = "loading";
    $("loadText").textContent = "Preparando la cámara mágica…";
    say("¡Preparando la cámara mágica!");
    try {
      await Promise.all([tracker.startCamera(), tracker.loadModel()]);
    } catch (e) {
      console.warn(e);
      tracker.stopCamera();
      store.mode = "touch"; save();
      $("loadText").textContent = "No he podido usar la cámara. Jugamos con el dedo.";
      say("No puedo usar la cámara. ¡Jugamos con el dedo!");
      await new Promise((r) => setTimeout(r, 2200));
    }
  }
  show("play");
  const touch = store.mode !== "camera";
  $("jumpBtn").hidden = $("duckBtn").hidden = true;
  touchAct.followX = null;
  $("pip").hidden = touch || store.view === "mirror";
  if (!gd.quiet) sfx.music(true);
  if (touch) beginPlay();
  else {
    phase = "calib";
    calibOk = 0;
    lastNag = 0;
    body.resetBase();
    const recent = performance.now() - lastCalibAt < 180000;
    calibNeed = recent ? 300 : 1200;
    lastNag = recent ? performance.now() : 0;
    if (!recent) say("¡Hola, Luca! Ponte delante del móvil, que te vea entero, de la cabeza a los pies.");
  }
}

function beginPlay() {
  phase = "play";
  startedAt = performance.now();
  lostSince = 0;
  body.resetBase();
  say(gameDef.intro);
  setTimeout(() => {
    if (phase !== "play") return;
    game = gameDef.create(app);
    const acts = (store.mode !== "camera" && (game.touchActions || gameDef.touchActions)) || [];
    $("jumpBtn").hidden = !acts.includes("jump");
    $("duckBtn").hidden = !acts.includes("duck");
  }, 2600);
}

function stopGame() {
  game = null;
  setCard();
  sfx.music(false);
  try { speechSynthesis.cancel(); } catch (e) {}
}

function endGame() {
  if (phase !== "play") return;
  const ach = earned;
  stopGame();
  phase = "results";
  show("results");
  sfx.fanfare();
  particles.rain(W, 90);
  $("rCount").textContent = ach;
  $("rStars").textContent = "★".repeat(Math.max(1, Math.min(3, Math.ceil(ach / 3))));
  // ¿personaje nuevo?
  const before = store.stars - ach;
  const fresh = CHARACTERS.find((c) => c.need > before && c.need <= store.stars);
  $("unlock").hidden = !fresh;
  if (fresh) {
    unlockChar = fresh;
    say("¡Has ganado " + ach + " estrellas! ¡Y tienes un personaje nuevo: " + fresh.name + "!");
  } else {
    unlockChar = null;
    say("¡Fin del juego! Has ganado " + ach + " estrellas. ¡Eres un campeón, Luca!");
  }
}
let unlockChar = null;

// ---------- calibración ----------
function calibState() {
  if (!body.present) return { ok: false, icon: "👀", text: "No te veo. Ponte delante del móvil.", voice: "No te veo, Luca. Ponte delante del móvil." };
  const p = body.p;
  const c = body.center();
  if (c.x < W * 0.22 || c.x > W * 0.78) return { ok: false, icon: "↔️", text: "Ponte en el centro.", voice: "Ponte en el centro, donde está la estrella." };
  const feet = p.la.v > 0.5 && p.ra.v > 0.5;
  const knees = p.lk.v > 0.5 && p.rk.v > 0.5;
  const tall = (feet ? Math.max(p.la.y, p.ra.y) : p.lk.y + body.torso) - p.nose.y;
  if (!knees || tall > H * 0.98) return { ok: false, icon: "👣", text: "Da unos pasos hacia atrás.", voice: "Da unos pasitos hacia atrás, que no te veo los pies." };
  if (tall < H * 0.35) return { ok: false, icon: "🚶", text: "Acércate un poco.", voice: "Acércate un poquito." };
  return { ok: true, icon: "👍", text: "¡Perfecto! Quédate ahí.", voice: "" };
}
function nagCalib(now, force) {
  const s = calibState();
  if (s.voice && (force || now - lastNag > 5000)) { lastNag = now; say(s.voice); }
}

// ---------- bucle principal ----------
let last = performance.now();
const pipCv = document.createElement("canvas");
pipCv.width = 160; pipCv.height = 120;
$("pip").append(pipCv);
const pipG = pipCv.getContext("2d");

function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;

  // entrada
  if (store.mode === "camera" && tracker.ready && (phase === "calib" || phase === "play")) {
    const lm = tracker.update(now);
    body.fromLandmarks(lm, tracker.coverMap(W, H), now);
  } else {
    if (!(game?.touchFollow || gameDef?.touchFollow)) touchAct.followX = null;
    body.fromTouch(W, H, now, touchAct);
  }
  body.touches = [...pointers.values()];

  g.clearRect(0, 0, W, H);
  if (phase === "menu" || phase === "loading") {
    menuBg(g, W, H, now);
    drawCharPreview($("charCv"), charObj(), now);
  } else if (phase === "results") {
    menuBg(g, W, H, now);
    if (unlockChar) drawCharPreview($("unlockCv"), unlockChar, now);
  } else {
    // fondo del mundo
    if (game?.drawBack) game.drawBack(g, now);
    else menuBg(g, W, H, now);
    // modo espejo: la imagen real de la cámara encima del fondo del mundo
    const mirror = store.mode === "camera" && store.view === "mirror" && tracker.ready;
    if (mirror) {
      const mp = tracker.coverMap(W, H);
      g.save();
      g.globalAlpha = 0.78;
      g.translate(W, 0); g.scale(-1, 1);
      try { g.drawImage(tracker.video, W - mp.ox - mp.dw, mp.oy, mp.dw, mp.dh); } catch (e) {}
      g.restore();
    }

    if (phase === "calib") {
      const s = calibState();
      // estrella en el suelo donde ponerse
      g.fillStyle = "rgba(255,201,60,.85)";
      g.beginPath(); g.ellipse(W / 2, H * 0.93, W * 0.12, H * 0.035, 0, 0, 7); g.fill();
      $("notice").hidden = false;
      $("nIcon").textContent = s.icon;
      $("nText").textContent = s.text;
      if (s.ok) {
        calibOk += dt;
        if (calibOk > calibNeed) {
          $("notice").hidden = true;
          const quick = calibNeed < 1200;
          lastCalibAt = now;
          if (!quick) { sfx.good(); say("¡Perfecto! ¡Te veo!"); }
          setTimeout(beginPlay, quick ? 0 : 900);
          phase = "calib-done";
        }
      } else {
        calibOk = 0;
        nagCalib(now, false);
      }
    } else if (phase === "play") {
      // si Luca se sale, el juego espera
      const lost = store.mode === "camera" && !body.present;
      if (lost) {
        if (!lostSince) lostSince = now;
        if (now - lostSince > 1500) {
          $("notice").hidden = false;
          $("nIcon").textContent = "👀";
          $("nText").textContent = "¡Vuelve! No te veo.";
          if (now - lastNag > 6000) { lastNag = now; say("¡Vuelve, Luca! No te veo."); }
        }
      } else {
        lostSince = 0;
        $("notice").hidden = true;
      }
      if (game && !(lost && now - lostSince > 1500)) game.update(dt, now, body);
      game?.draw?.(g, now, body);
    }
    // el avatar de Luca
    const front = phase === "play" && game?.drawFront;
    const onTop = game?.avatarOnTop || gameDef?.avatarOnTop;
    if (front && onTop) game.drawFront(g, now, body);
    if (mirror && body.present) {
      // en espejo solo se marcan las manos (y pies) para saber con qué se toca
      for (const hnd of body.hitters(true)) {
        g.save(); g.strokeStyle = "#ffc93c"; g.lineWidth = 6; g.fillStyle = "rgba(255,201,60,.35)";
        g.beginPath(); g.arc(hnd.x, hnd.y, hnd.r * 0.8, 0, 7); g.fill(); g.stroke(); g.restore();
      }
    } else if (body.present && body.p && !(phase === "play" && gameDef?.hideAvatar)) drawAvatar(g, body.p, charObj(), now, { happy: now < happyUntil, alpha: phase === "play" ? (game?.avatarAlpha || 1) : 0.95 });
    if (front && !onTop) game.drawFront(g, now, body);
    // dedos
    if (store.mode !== "camera") {
      for (const t of body.touches) {
        g.fillStyle = "rgba(255,201,60,.5)";
        g.beginPath(); g.arc(t.x, t.y, body.sw * 0.45, 0, 7); g.fill();
      }
    }
    // miniatura de la cámara
    if (store.mode === "camera" && tracker.ready) {
      pipG.save();
      pipG.translate(160, 0); pipG.scale(-1, 1);
      try { pipG.drawImage(tracker.video, 0, 0, 160, 120); } catch (e) {}
      pipG.restore();
    }
  }
  particles.update(dt);
  particles.draw(g);
  requestAnimationFrame(frame);
}

document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && phase === "play") keepAwake(); });

buildMenu();
requestAnimationFrame(frame);

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
// primera interacción: saludo
document.addEventListener("pointerdown", function hello() {
  document.removeEventListener("pointerdown", hello);
  sfx.unlock();
  if (phase === "menu") say(pick(["¡Hola, Luca! Elige un juego.", "¡Hola, Luca! ¿A qué jugamos?"]));
}, { once: true });

// depuración: ?debug expone el estado para pruebas automáticas
if (new URLSearchParams(location.search).has("debug")) {
  window.__luca = { body, tracker, get phase() { return phase; }, get game() { return game; }, store };
}
