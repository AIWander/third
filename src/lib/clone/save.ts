import { DEFAULT_TRAITS, type CloneDossier, type Stage } from "./types";
import { pickCallsign } from "./catalog";

const KEY = "third.forge.v1";
const BACKUP = "third.forge.v1.bak";

export function blankDossier(): CloneDossier {
  return {
    version: 1,
    stage: "ingress",
    seedId: null,
    voiceId: null,
    mandates: [],
    traits: { ...DEFAULT_TRAITS },
    name: "",
    callsign: pickCallsign(),
    trace: "",
    anonymous: true,
    ignitedAt: null,
    messages: [],
  };
}

function isStage(v: unknown): v is Stage {
  return (
    v === "ingress" ||
    v === "seed" ||
    v === "voice" ||
    v === "mandate" ||
    v === "lattice" ||
    v === "bond" ||
    v === "ignition" ||
    v === "desk"
  );
}

export function loadSave(): CloneDossier | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CloneDossier>;
    const base = blankDossier();
    const stage = isStage(parsed.stage) ? parsed.stage : "ingress";
    const dossier: CloneDossier = {
      ...base,
      ...parsed,
      version: 1,
      stage: stage === "ignition" ? (parsed.ignitedAt ? "desk" : "bond") : stage,
      traits: { ...DEFAULT_TRAITS, ...(parsed.traits ?? {}) },
      mandates: Array.isArray(parsed.mandates) ? parsed.mandates : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages.slice(-24) : [],
      callsign: (parsed.callsign || base.callsign).slice(0, 8).toUpperCase(),
    };
    return dossier;
  } catch {
    return null;
  }
}

export function writeSave(d: CloneDossier): void {
  if (typeof window === "undefined") return;
  try {
    const prev = window.localStorage.getItem(KEY);
    if (prev) window.localStorage.setItem(BACKUP, prev);
    window.localStorage.setItem(KEY, JSON.stringify({ ...d, version: 1 as const }));
  } catch {
    // private mode / quota — stay in-memory
  }
}

export function clearSave(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
