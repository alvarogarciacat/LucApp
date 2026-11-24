// Tarjeta grande arriba con lo que Luca tiene que hacer, en dibujos (no hace falta saber leer).
import { skeleton } from "./body.js";

export function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

const card = () => document.getElementById("card");

export function setCard(...nodes) {
  const c = card();
  c.replaceChildren(...nodes);
  c.classList.remove("pop");
  void c.offsetWidth;
  c.classList.add("pop");
  c.hidden = nodes.length === 0;
}

export function numberCard(n) {
  const wrap = h("div", "c-row");
  wrap.append(h("span", "c-num", String(n)));
  const dots = h("span", "c-dots");
  for (let i = 0; i < n; i++) dots.append(h("i"));
  wrap.append(dots);
  return wrap;
}

export function colorCard(c) {
  const d = h("span", "c-color");
  d.style.background = c;
  return d;
}

export function letterCard(l) {
  return h("span", "c-num", l);
}

export function fruitCard(emoji, n, got) {
  const wrap = h("div", "c-row");
  for (let i = 0; i < n; i++) {
    const s = h("span", "c-fruit" + (i < got ? " got" : ""), emoji);
    wrap.append(s);
  }
  return wrap;
}

export function actionCard(icon, cls = "") {
  return h("span", "c-action " + cls, icon);
}

export function starsCard(n = 3) {
  return h("span", "c-stars", "★".repeat(n));
}

/** Dibujo de la postura que tiene que copiar. */
export function poseCard(pose) {
  const cv = document.createElement("canvas");
  const s = 2;
  cv.width = 110 * s;
  cv.height = 110 * s;
  cv.className = "c-pose";
  const g = cv.getContext("2d");
  g.scale(s, s);
  const p = skeleton(55, 64, 14, pose);
  g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = "#7a3fb0"; g.lineWidth = 7;
  const seg = (...k) => { g.beginPath(); g.moveTo(p[k[0]].x, p[k[0]].y); for (const q of k.slice(1)) g.lineTo(p[q].x, p[q].y); g.stroke(); };
  seg("lh", "lk", "la"); seg("rh", "rk", "ra"); seg("ls", "le", "lw"); seg("rs", "re", "rw");
  g.fillStyle = "#7a3fb0"; g.beginPath(); g.moveTo(p.ls.x, p.ls.y); g.lineTo(p.rs.x, p.rs.y); g.lineTo(p.rh.x, p.rh.y); g.lineTo(p.lh.x, p.lh.y); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.arc(p.nose.x, p.nose.y - 2, 9, 0, 7); g.fill();
  g.fillStyle = "#ffc93c"; for (const k of ["lw", "rw"]) { g.beginPath(); g.arc(p[k].x, p[k].y, 4.5, 0, 7); g.fill(); }
  return cv;
}
