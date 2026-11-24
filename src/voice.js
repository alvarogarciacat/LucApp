// Voz en español. Luca no sabe leer: todo lo importante se dice en voz alta.
let voice = null;
let muted = false;

function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    voice =
      vs.find((v) => /es[-_]ES/i.test(v.lang) && /google|mónica|monica|lucía|lucia|paulina/i.test(v.name)) ||
      vs.find((v) => /es[-_]ES/i.test(v.lang)) ||
      vs.find((v) => v.lang && v.lang.toLowerCase().startsWith("es")) ||
      null;
  } catch (e) {
    voice = null;
  }
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export function setMuted(m) {
  muted = m;
  if (m) try { speechSynthesis.cancel(); } catch (e) {}
}

/** Dice un texto. Devuelve una promesa que se resuelve al terminar (o tras un tiempo máximo). */
export function say(text, { interrupt = true } = {}) {
  return new Promise((resolve) => {
    if (muted || !("speechSynthesis" in window)) return setTimeout(resolve, 300);
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    try {
      if (interrupt) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-ES";
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.pitch = 1.15;
      u.onend = finish;
      u.onerror = finish;
      speechSynthesis.speak(u);
    } catch (e) {
      finish();
    }
    setTimeout(finish, 1200 + text.length * 85);
  });
}

export const NUMS = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];
export const PRAISE = ["¡Muy bien, Luca!", "¡Genial!", "¡Eres un campeón!", "¡Bravo, Luca!", "¡Lo has conseguido!", "¡Increíble!", "¡Qué crack!"];
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
