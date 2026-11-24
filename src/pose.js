// Cámara + detección del cuerpo con MediaPipe Pose (funciona dentro del navegador, sin servidor).
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const BASE = import.meta.env.BASE_URL;

export class Tracker {
  constructor(video) {
    this.video = video;
    this.stream = null;
    this.landmarker = null;
    this.lastVideoTime = -1;
    this.smooth = null; // landmarks suavizados, coordenadas normalizadas y en espejo
    this.lastSeen = 0;
  }

  async startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-camera-api");
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    this.video.srcObject = this.stream;
    this.video.muted = true;
    this.video.playsInline = true;
    await this.video.play();
  }

  stopCamera() {
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.smooth = null;
  }

  async loadModel() {
    if (this.landmarker) return;
    const fileset = await FilesetResolver.forVisionTasks(BASE + "wasm");
    const make = (delegate) =>
      PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: BASE + "models/pose_landmarker_lite.task", delegate },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    try {
      this.landmarker = await make("GPU");
    } catch (e) {
      this.landmarker = await make("CPU");
    }
  }

  get ready() {
    return !!(this.landmarker && this.stream && this.video.readyState >= 2);
  }

  /** Ejecuta la detección si hay un fotograma nuevo. Devuelve landmarks suavizados o null. */
  update(now) {
    if (!this.ready) return null;
    const v = this.video;
    if (v.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = v.currentTime;
      let res;
      try {
        res = this.landmarker.detectForVideo(v, now);
      } catch (e) {
        return this.smooth;
      }
      const lm = res?.landmarks?.[0];
      if (lm) {
        this.lastSeen = now;
        if (!this.smooth || this.smooth.length !== lm.length) {
          this.smooth = lm.map((p) => ({ x: 1 - p.x, y: p.y, v: p.visibility ?? 1 }));
        } else {
          for (let i = 0; i < lm.length; i++) {
            const s = this.smooth[i];
            const nx = 1 - lm[i].x, ny = lm[i].y;
            const speed = Math.hypot(nx - s.x, ny - s.y);
            // filtro adaptativo: suave cuando está quieto, rápido cuando se mueve
            const a = Math.min(0.9, 0.35 + speed * 10);
            s.x += (nx - s.x) * a;
            s.y += (ny - s.y) * a;
            s.v += ((lm[i].visibility ?? 1) - s.v) * 0.5;
          }
        }
      } else if (now - this.lastSeen > 600) {
        this.smooth = null;
      }
    }
    return this.smooth;
  }

  /** Transformación "cover" del vídeo a la pantalla (misma que se usa para pintar). */
  coverMap(W, H) {
    const vw = this.video.videoWidth || 1280, vh = this.video.videoHeight || 720;
    const s = Math.max(W / vw, H / vh);
    const dw = vw * s, dh = vh * s;
    const ox = (W - dw) / 2, oy = (H - dh) / 2;
    return { ox, oy, dw, dh };
  }
}
