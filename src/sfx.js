// Sonidos sintetizados (sin archivos) y una música de fondo suave.
let ac = null;
let master = null;
let musicGain = null;
let musicTimer = 0;
let soundOn = true;

export function unlock() {
  try {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = 0.9;
      master.connect(ac.destination);
      musicGain = ac.createGain();
      musicGain.gain.value = 0.0;
      musicGain.connect(master);
    }
    if (ac.state === "suspended") ac.resume();
  } catch (e) {}
}

export function setSound(on) {
  soundOn = on;
  if (master) master.gain.value = on ? 0.9 : 0;
}

function tone(freq, start, dur, { type = "triangle", vol = 0.2, slide = 0, dest = null } = {}) {
  if (!ac || !soundOn) return;
  const t = ac.currentTime + start;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest || master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const pop = () => { tone(700, 0, 0.09, { type: "sine", vol: 0.3, slide: 600 }); tone(1400, 0.03, 0.08, { type: "sine", vol: 0.12 }); };
export const good = () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, { vol: 0.2 }));
export const oops = () => { tone(330, 0, 0.18, { type: "sine", vol: 0.2, slide: -120 }); tone(250, 0.16, 0.22, { type: "sine", vol: 0.18, slide: -80 }); };
export const jump = () => tone(300, 0, 0.25, { type: "square", vol: 0.08, slide: 500 });
export const whoosh = () => tone(900, 0, 0.3, { type: "sawtooth", vol: 0.04, slide: -700 });
export const tick = (n = 0) => tone(500 + n * 60, 0, 0.1, { type: "square", vol: 0.07 });
export const star = () => { tone(1320, 0, 0.12, { type: "sine", vol: 0.15 }); tone(1760, 0.07, 0.18, { type: "sine", vol: 0.12 }); };
export const fanfare = () => {
  [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, { vol: 0.18 }));
  [196, 262, 330].forEach((f, i) => tone(f, i * 0.36, 0.5, { type: "sine", vol: 0.12 }));
};

// Música: bucle pentatónico alegre generado en tiempo real
const SCALE = [262, 294, 330, 392, 440, 523, 587, 659];
const PATTERNS = [
  [0, 2, 4, 2, 5, 4, 2, 1],
  [4, 5, 7, 5, 4, 2, 4, 0],
  [2, 4, 5, 4, 2, 1, 0, 1],
  [5, 4, 2, 4, 7, 5, 4, 2],
];
export function music(on) {
  if (!ac) return;
  clearInterval(musicTimer);
  if (!on) { musicGain.gain.setTargetAtTime(0, ac.currentTime, 0.3); return; }
  musicGain.gain.setTargetAtTime(0.5, ac.currentTime, 0.5);
  let step = 0;
  const beat = 0.24;
  musicTimer = setInterval(() => {
    if (!soundOn) return;
    const pat = PATTERNS[Math.floor(step / 16) % PATTERNS.length];
    const n = pat[step % 8];
    tone(SCALE[n], 0, beat * 0.9, { type: "triangle", vol: 0.05, dest: musicGain });
    if (step % 4 === 0) tone(SCALE[pat[0]] / 2, 0, beat * 3, { type: "sine", vol: 0.07, dest: musicGain });
    if (step % 2 === 1) tone(80, 0, 0.05, { type: "square", vol: 0.015, dest: musicGain });
    step++;
  }, beat * 1000);
}
