// Juegos de "toca el correcto" construidos con la misma fábrica.
import { pickGame, shuffle, pick, disc, text, emoji, shape, SHAPES, canvasCard, dice } from "../kit.js";
import { sea, orchard, magic, meadow } from "../scene.js";
import { NUMS } from "../voice.js";
import { h } from "../hud.js";

const TINTS = ["#ffc93c", "#3ccf7a", "#ff5d8f", "#5ad1ff", "#ff9f43", "#b48cff"];
const SHAPE_COLORS = ["#ff3b3b", "#2b7bff", "#ffd31a", "#26c766", "#ff8a1f", "#9b4dff"];

// ---------- Formas ----------
export const formas = pickGame({
  id: "formas", title: "Formas", icon: "🔺", color: "#ffc93c",
  intro: "¡Las formas! Toca con la mano la forma que te diga.",
  rounds: 9, back: magic,
  makeRound(i) {
    const kinds = shuffle(Object.keys(SHAPES)).slice(0, i < 3 ? 3 : 4);
    const target = pick(kinds);
    const cols = shuffle(SHAPE_COLORS);
    return {
      target,
      items: kinds.map((k, j) => ({ v: k, draw: (g, x, y, r) => { g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); shape(g, k, x, y, r * 0.72, cols[j]); } })),
      ask: "¡Toca " + SHAPES[target] + "!",
      card: () => canvasCard((g, w, hh) => shape(g, target, w / 2, hh / 2, 40, "#ff5d8f")),
      wrong: (v) => "Eso es " + SHAPES[v] + ". Busca " + SHAPES[target] + ".",
    };
  },
});

// ---------- Animales ----------
const ANIMALS = [
  { e: "🐮", n: "la vaca", s: "muuuu" }, { e: "🐶", n: "el perro", s: "guau guau" }, { e: "🐱", n: "el gato", s: "miau" },
  { e: "🦆", n: "el pato", s: "cua cua" }, { e: "🐑", n: "la oveja", s: "beeee" }, { e: "🐓", n: "el gallo", s: "quiquiriquí" },
  { e: "🦁", n: "el león", s: "grrrrr" }, { e: "🐷", n: "el cerdito", s: "oinc oinc" }, { e: "🐸", n: "la rana", s: "croac croac" },
  { e: "🐴", n: "el caballo", s: "iiiiihi" }, { e: "🐘", n: "el elefante", s: "tuuuuu" }, { e: "🐵", n: "el mono", s: "uh uh ah ah" },
];
export const animales = pickGame({
  id: "animales", title: "Animales", icon: "🐮", color: "#3ccf7a",
  intro: "¡La granja! Escucha bien y toca el animal.",
  rounds: 10, back: orchard,
  makeRound(i) {
    const set = shuffle(ANIMALS).slice(0, i < 3 ? 3 : 4);
    const target = pick(set);
    const bySound = i % 2 === 1;
    return {
      target,
      items: set.map((a, j) => ({ v: a, draw: (g, x, y, r) => { disc(g, x, y, r, TINTS[j % TINTS.length]); emoji(g, a.e, x, y + r * 0.05, r * 1.15); } })),
      ask: bySound ? "¿Quién hace " + target.s + "? ¡Tócalo!" : "¡Toca " + target.n + "!",
      card: () => h("span", "c-num", bySound ? "👂" : target.e),
      wrong: (v) => "Ese es " + v.n + ", que hace " + v.s + ".",
      right: () => "¡Sí! Es " + target.n + ". ¡" + target.s + "!",
    };
  },
});

// ---------- Cuenta y toca ----------
const COUNTABLE = ["🍓", "⭐", "🐟", "🎈", "🍪", "🐞", "🚗", "🌸"];
const COUNT_NAMES = { "🍓": "fresas", "⭐": "estrellas", "🐟": "peces", "🎈": "globos", "🍪": "galletas", "🐞": "mariquitas", "🚗": "coches", "🌸": "flores" };
export const cuenta = pickGame({
  id: "cuenta", title: "Cuenta", icon: "🔢", color: "#5ad1ff",
  intro: "¡A contar! Cuenta los dibujos y toca el número.",
  rounds: 8, back: sea,
  makeRound(i) {
    const max = i < 3 ? 4 : 6;
    const n = 1 + Math.floor(Math.random() * max);
    const opts = shuffle([n, ...shuffle([1, 2, 3, 4, 5, 6].filter((k) => k !== n)).slice(0, 2)]);
    const what = pick(COUNTABLE);
    return {
      target: n,
      items: opts.map((v, j) => ({ v, draw: (g, x, y, r) => { disc(g, x, y, r, TINTS[j]); text(g, String(v), x, y, r * 1.05); } })),
      ask: "¿Cuántas " + COUNT_NAMES[what] + " hay? ¡Cuenta y toca el número!",
      card: () => { const w = h("div", "c-row c-count"); for (let k = 0; k < n; k++) w.append(h("span", "c-fruit got", what)); return w; },
      wrong: (v) => "Ese es el " + NUMS[v] + ". Vamos a contar juntos: " + [...Array(n)].map((_, k) => NUMS[k + 1]).join(", ") + ".",
      right: () => "¡Sí! ¡Hay " + NUMS[n] + "!",
    };
  },
});

// ---------- Dados (reconocer cantidades) ----------
export const dados = pickGame({
  id: "dados", title: "Dados", icon: "🎲", color: "#ff9f43",
  intro: "¡Los dados! Toca el dado que tiene los puntos que te diga.",
  rounds: 8, back: meadow,
  makeRound(i) {
    const opts = shuffle([1, 2, 3, 4, 5, 6]).slice(0, i < 3 ? 3 : 4);
    const target = pick(opts);
    return {
      target,
      items: opts.map((v) => ({ v, draw: (g, x, y, r) => { g.fillStyle = "#fff"; g.strokeStyle = "#13224a"; g.lineWidth = 5; g.beginPath(); g.roundRect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7, r * 0.3); g.fill(); g.stroke(); dice(g, v, x, y, r * 1.5, "#ff3b3b"); } })),
      ask: "¡Toca el dado con " + NUMS[target] + (target === 1 ? " punto!" : " puntos!"),
      card: () => h("span", "c-num", String(target)),
      wrong: (v) => "Ese tiene " + NUMS[v] + ". Busca el de " + NUMS[target] + ".",
    };
  },
});

// ---------- Las letras de LUCA ----------
const WORDS = [
  { w: "LUCA", say: "¡Luca! ¡Tu nombre!" },
  { w: "MAMA", say: "¡Mamá!" },
  { w: "PAPA", say: "¡Papá!" },
  { w: "SOL", say: "¡Sol!" },
];
const OTHER = "BDEFIMNOPRST".split("");
export const nombre = pickGame({
  id: "nombre", title: "Mi nombre", icon: "🔤", color: "#ff5d8f",
  intro: "¡Vamos a escribir tu nombre! Toca las letras en orden.",
  rounds: 30, back: magic,
  state: () => ({ wi: 0, li: 0 }),
  makeRound(i, st) {
    if (st.wi >= WORDS.length) return null;
    const word = WORDS[st.wi].w;
    const letter = word[st.li];
    const distract = shuffle(OTHER.filter((c) => !word.includes(c))).slice(0, 2);
    const opts = shuffle([letter, ...distract]);
    const doneUpTo = st.li;
    const advance = () => {
      st.li++;
      if (st.li >= word.length) {
        const t = word.split("").join(", ") + ". " + WORDS[st.wi].say;
        st.wi++; st.li = 0;
        return t;
      }
      return "¡Muy bien! La " + letter + ".";
    };
    return {
      target: letter,
      items: opts.map((v, j) => ({ v, draw: (g, x, y, r) => { disc(g, x, y, r, TINTS[(j + 2) % TINTS.length]); text(g, v, x, y, r * 1.1); } })),
      ask: "¡Busca la " + letter + "!",
      card: () => {
        const w = h("div", "c-row c-word");
        word.split("").forEach((c, k) => w.append(h("span", "c-letter" + (k < doneUpTo ? " got" : k === doneUpTo ? " now" : ""), c)));
        return w;
      },
      wrong: (v) => "Esa es la " + v + ". Busca la " + letter + ".",
      right: advance,
    };
  },
});
