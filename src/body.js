// El cuerpo de Luca en coordenadas de pantalla, con detección de saltos, agacharse y posturas.

// Índices de MediaPipe Pose
const IDX = { nose: 0, ls: 11, rs: 12, le: 13, re: 14, lw: 15, rw: 16, li: 19, ri: 20, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28 };
export const JOINTS = Object.keys(IDX);

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Plantillas de posturas en "unidades de hombro" (ancho de hombros = 1), origen en la cadera, y hacia abajo. */
export const TEMPLATES = {
  stand: { nose: [0, -2.3], ls: [-0.5, -1.6], rs: [0.5, -1.6], le: [-0.68, -0.9], re: [0.68, -0.9], lw: [-0.72, -0.22], rw: [0.72, -0.22], lh: [-0.3, 0], rh: [0.3, 0], lk: [-0.32, 1.0], rk: [0.32, 1.0], la: [-0.33, 2.0], ra: [0.33, 2.0] },
  arbol: { le: [-0.6, -2.35], lw: [-0.35, -3.05], re: [0.6, -2.35], rw: [0.35, -3.05] },
  avion: { le: [-1.2, -1.6], lw: [-1.9, -1.6], re: [1.2, -1.6], rw: [1.9, -1.6] },
  estrella: { le: [-1.0, -2.1], lw: [-1.55, -2.65], re: [1.0, -2.1], rw: [1.55, -2.65], lk: [-0.62, 1.0], la: [-0.95, 1.95], rk: [0.62, 1.0], ra: [0.95, 1.95] },
  saludo: { re: [0.8, -2.3], rw: [0.75, -3.0] },
  cintura: { le: [-1.05, -0.85], lw: [-0.38, -0.12], re: [1.05, -0.85], rw: [0.38, -0.12] },
  cabeza: { le: [-0.95, -2.3], lw: [-0.45, -2.55], re: [0.95, -2.3], rw: [0.45, -2.55] },
  barriga: { le: [-0.85, -0.95], lw: [-0.12, -0.75], re: [0.85, -0.95], rw: [0.12, -0.75] },
  palmada: { le: [-0.7, -1.0], lw: [-0.06, -1.35], re: [0.7, -1.0], rw: [0.06, -1.35] },
  rodillas: { nose: [0, -1.9], ls: [-0.5, -1.25], rs: [0.5, -1.25], le: [-0.62, -0.55], re: [0.62, -0.55], lw: [-0.4, 0.95], rw: [0.4, 0.95] },
  pelota: { nose: [0, -1.25], ls: [-0.5, -0.6], rs: [0.5, -0.6], le: [-0.85, 0.05], re: [0.85, 0.05], lw: [-0.45, 0.6], rw: [0.45, 0.6], lh: [-0.3, 0.75], rh: [0.3, 0.75], lk: [-0.62, 1.15], rk: [0.62, 1.15], la: [-0.4, 2.0], ra: [0.4, 2.0] },
};

/** Construye un esqueleto en píxeles a partir de una plantilla. */
export function skeleton(cx, hipY, sw, pose = "stand", lift = 0) {
  const t = { ...TEMPLATES.stand, ...(TEMPLATES[pose] || {}) };
  const out = {};
  for (const k of JOINTS) {
    const v = t[k];
    if (!v) continue;
    out[k] = { x: cx + v[0] * sw, y: hipY + v[1] * sw - lift, v: 1 };
  }
  out.li = out.lw; out.ri = out.rw;
  return out;
}

export class Body {
  constructor() {
    this.p = null; // puntos en px
    this.present = false;
    this.base = null; // línea base para saltos/agacharse
    this.jumping = false;
    this.ducking = false;
    this.lastJump = -1e9;
    this.lastDuck = -1e9;
    this.jumps = 0;
    this.touches = []; // en modo táctil: dedos en pantalla
    this.mode = "camera";
    this.sw = 100;
    this.motion = 0; // cuánto se mueve (para estatuas)
    this.flap = 0; // fuerza de aleteo de brazos (para volar)
    this.prevP = null;
    this.taps = 0;
  }

  /** Modo cámara: landmarks normalizados -> px. */
  fromLandmarks(lm, map, now) {
    if (!lm) { this.present = false; return; }
    const p = {};
    for (const k of JOINTS) {
      const s = lm[IDX[k]];
      p[k] = { x: map.ox + s.x * map.dw, y: map.oy + s.y * map.dh, v: s.v };
    }
    this.prevP = this.p && this.mode === "camera" ? this.p : null;
    this.p = p;
    this.mode = "camera";
    this.present = p.ls.v > 0.5 && p.rs.v > 0.5 && p.nose.v > 0.4;
    this.analyze(now);
  }

  /** Modo táctil: un muñeco de pie; saltar/agacharse con botones; los dedos son las "manos". */
  fromTouch(W, H, now, action) {
    const sw = Math.min(W, H) * 0.11;
    let lift = 0, pose = "stand";
    const tj = now - action.jumpAt;
    if (tj < 650) lift = Math.sin((tj / 650) * Math.PI) * sw * 1.6;
    if (now - action.duckAt < 900) pose = "pelota";
    const cx = action.followX != null ? Math.max(sw * 2, Math.min(W - sw * 2, action.followX)) : W * 0.5;
    this.p = skeleton(cx, H * 0.86 - sw * 2.1, sw, action.pose || pose, lift);
    this.motion = now - (action.moveAt || -1e9) < 300 ? 0.2 : 0;
    this.flap = 0;
    this.mode = "touch";
    this.present = true;
    this.jumping = tj < 650;
    this.ducking = pose === "pelota";
    this.lastJump = action.jumpAt;
    this.lastDuck = action.duckAt;
    this.sw = sw;
  }

  visible(...keys) {
    return this.p && keys.every((k) => this.p[k] && this.p[k].v > 0.5);
  }

  analyze(now) {
    const p = this.p;
    if (!this.present) return;
    const sh = mid(p.ls, p.rs);
    const hip = mid(p.lh, p.rh);
    this.sw = Math.max(20, dist(p.ls, p.rs));
    const torso = Math.max(this.sw, dist(sh, hip));
    this.torso = torso;
    if (!this.base) this.base = { hipY: hip.y, shY: sh.y };
    const b = this.base;
    const wasJ = this.jumping, wasD = this.ducking;
    this.jumping = hip.y < b.hipY - 0.16 * torso;
    this.ducking = sh.y > b.shY + 0.33 * torso;
    if (this.jumping && !wasJ) { this.lastJump = now; this.jumps++; }
    if (this.ducking && !wasD) this.lastDuck = now;
    // movimiento y aleteo
    const q = this.prevP;
    if (q) {
      let m = 0, n = 0;
      for (const k of ["nose", "lw", "rw", "le", "re", "ls", "rs", "lh", "rh", "lk", "rk"]) if (p[k].v > 0.5 && q[k]) { m += dist(p[k], q[k]); n++; }
      this.motion = this.motion * 0.8 + (n ? m / n / this.sw : 0) * 0.2;
      const down = ((p.lw.y - q.lw.y) + (p.rw.y - q.rw.y)) / 2 / this.sw;
      this.flap = this.flap * 0.7 + Math.max(0, down) * 0.3;
    }
    // la línea base se adapta despacio cuando está de pie (si se acerca o se aleja)
    if (!this.jumping && !this.ducking) {
      const k = hip.y > b.hipY ? 0.08 : 0.03;
      b.hipY += (hip.y - b.hipY) * k;
      b.shY += (sh.y - b.shY) * k;
    }
  }

  resetBase() { this.base = null; }

  /** Manos (y pies) como círculos que pueden tocar cosas. */
  hitters(includeFeet = false) {
    if (this.mode === "touch") return this.touches.map((t) => ({ x: t.x, y: t.y, r: this.sw * 0.45 }));
    const p = this.p;
    if (!p || !this.present) return [];
    const out = [];
    const r = this.sw * 0.42;
    for (const [w, i] of [["lw", "li"], ["rw", "ri"]]) {
      if (p[w].v > 0.4) {
        const h = p[i] && p[i].v > 0.3 ? mid(p[w], p[i]) : p[w];
        out.push({ x: h.x, y: h.y, r });
      }
    }
    if (includeFeet) for (const a of ["la", "ra"]) if (p[a].v > 0.5) out.push({ x: p[a].x, y: p[a].y, r: r * 1.1 });
    return out;
  }

  /** ¿Está haciendo esta postura? Comprobaciones tolerantes, pensadas para un niño pequeño. */
  matches(pose) {
    const p = this.p;
    if (!p || !this.present) return false;
    if (this.mode === "touch") return false;
    const sw = this.sw;
    const shY = (p.ls.y + p.rs.y) / 2;
    const up = (w) => p[w].v > 0.4 && p[w].y < p.nose.y;
    switch (pose) {
      case "arbol":
        return up("lw") && up("rw");
      case "avion": {
        const side = (w, s, dir) => p[w].v > 0.4 && Math.abs(p[w].y - shY) < 0.75 * sw && (p[w].x - p[s].x) * dir > 0.9 * sw;
        return side("lw", "ls", -1) && side("rw", "rs", 1);
      }
      case "estrella": {
        const diag = (w, s, dir) => p[w].v > 0.4 && p[w].y < shY && (p[w].x - p[s].x) * dir > 0.5 * sw;
        const arms = diag("lw", "ls", -1) && diag("rw", "rs", 1);
        const legs = p.la.v > 0.5 && p.ra.v > 0.5 ? Math.abs(p.la.x - p.ra.x) > 1.1 * sw : true;
        return arms && legs;
      }
      case "saludo":
        return (up("lw") && p.rw.y > shY) || (up("rw") && p.lw.y > shY);
      case "cintura": {
        const nearHip = (w, h) => p[w].v > 0.4 && dist(p[w], p[h]) < 0.75 * sw;
        return nearHip("lw", "lh") && nearHip("rw", "rh");
      }
      case "pelota":
        return this.ducking;
      case "cabeza":
        return ["lw", "rw"].some((w) => p[w].v > 0.4 && dist(p[w], p.nose) < 1.0 * sw && p[w].y < shY);
      case "barriga": {
        const c = this.center();
        return ["lw", "rw"].some((w) => p[w].v > 0.4 && dist(p[w], c) < 0.75 * sw);
      }
      case "palmada":
        return p.lw.v > 0.4 && p.rw.v > 0.4 && dist(p.lw, p.rw) < 0.55 * sw && p.lw.y < (p.lh.y + shY) / 2 + sw;
      case "rodillas":
        return (p.lw.v > 0.4 && p.lk.v > 0.4 && dist(p.lw, p.lk) < 0.9 * sw) || (p.rw.v > 0.4 && p.rk.v > 0.4 && dist(p.rw, p.rk) < 0.9 * sw);
      case "salta":
        return this.jumping;
      default:
        return false;
    }
  }

  center() {
    if (!this.p) return null;
    return mid(mid(this.p.ls, this.p.rs), mid(this.p.lh, this.p.rh));
  }
}
