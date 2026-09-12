let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let droneGain: GainNode | null = null;
let drones: OscillatorNode[] = [];
let muted = false;
let unlocked = false;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.22;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const audio = ensure();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  unlocked = true;
}

export function installAudioUnlock(): () => void {
  const kick = () => unlockAudio();
  window.addEventListener("pointerdown", kick, { once: true });
  window.addEventListener("keydown", kick, { once: true });
  const onVis = () => {
    if (document.visibilityState === "visible") unlockAudio();
  };
  document.addEventListener("visibilitychange", onVis);
  return () => {
    window.removeEventListener("pointerdown", kick);
    window.removeEventListener("keydown", kick);
    document.removeEventListener("visibilitychange", onVis);
  };
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  if (!master || !ctx) return;
  master.gain.setTargetAtTime(next ? 0 : 0.22, ctx.currentTime, 0.04);
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

function blip(freq: number, dur: number, type: OscillatorType, gain = 0.08): void {
  const audio = ensure();
  if (!audio || !master || muted) return;
  if (audio.state === "suspended") return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, audio.currentTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
  osc.connect(g);
  g.connect(master);
  osc.start();
  osc.stop(audio.currentTime + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

export function playTick(): void {
  unlockAudio();
  const f = 820 + Math.random() * 90;
  blip(f, 0.07, "square", 0.04);
}

export function playLock(): void {
  unlockAudio();
  blip(220, 0.18, "sine", 0.07);
  window.setTimeout(() => blip(440, 0.12, "triangle", 0.05), 70);
}

export function playIgnite(): void {
  unlockAudio();
  const audio = ensure();
  if (!audio || !master || muted) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(80, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, audio.currentTime + 0.9);
  g.gain.setValueAtTime(0.0001, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.06, audio.currentTime + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 1.1);
  osc.connect(g);
  g.connect(master);
  osc.start();
  osc.stop(audio.currentTime + 1.15);
}

export function startDrone(): void {
  const audio = ensure();
  if (!audio || !master || drones.length) return;
  droneGain = audio.createGain();
  droneGain.gain.value = 0.0001;
  droneGain.connect(master);
  const freqs = [55, 82.5, 110];
  drones = freqs.map((f, i) => {
    const osc = audio.createOscillator();
    osc.type = i === 2 ? "triangle" : "sine";
    osc.frequency.value = f;
    osc.connect(droneGain!);
    osc.start();
    return osc;
  });
  droneGain.gain.setTargetAtTime(0.035, audio.currentTime, 0.6);
}

export function stopDrone(): void {
  if (!ctx || !droneGain) return;
  droneGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
  const nodes = drones;
  const g = droneGain;
  drones = [];
  droneGain = null;
  window.setTimeout(() => {
    for (const osc of nodes) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        /* already stopped */
      }
    }
    g.disconnect();
  }, 600);
}

export function audioUnlocked(): boolean {
  return unlocked;
}
