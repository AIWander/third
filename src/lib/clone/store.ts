import { create } from "zustand";
import type { TraitKey } from "./catalog";
import { blankDossier, clearSave, loadSave, writeSave } from "./save";
import type {
  ChatMessage,
  CloneDossier,
  MandateId,
  SeedId,
  Stage,
  VoiceId,
} from "./types";

type CloneStore = CloneDossier & {
  pulseId: number;
  hydrated: boolean;
  hydrate: () => void;
  persist: () => void;
  pulse: () => void;
  setStage: (stage: Stage) => void;
  setSeed: (id: SeedId) => void;
  setVoice: (id: VoiceId) => void;
  toggleMandate: (id: MandateId) => void;
  setTrait: (key: TraitKey, value: number) => void;
  setName: (name: string) => void;
  setCallsign: (callsign: string) => void;
  setTrace: (trace: string) => void;
  setAnonymous: (anonymous: boolean) => void;
  ignite: () => void;
  pushMessage: (msg: ChatMessage) => void;
  reforge: () => void;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export const useCloneStore = create<CloneStore>((set, get) => ({
  ...blankDossier(),
  pulseId: 0,
  hydrated: false,
  hydrate: () => {
    const saved = loadSave();
    if (saved) {
      set({ ...saved, hydrated: true, pulseId: 0 });
    } else {
      set({ hydrated: true });
    }
  },
  persist: () => {
    const s = get();
    if (!s.hydrated) return;
    const dossier: CloneDossier = {
      version: 1,
      stage: s.stage,
      seedId: s.seedId,
      voiceId: s.voiceId,
      mandates: s.mandates,
      traits: s.traits,
      name: s.name,
      callsign: s.callsign,
      trace: s.trace,
      anonymous: s.anonymous,
      ignitedAt: s.ignitedAt,
      messages: s.messages.slice(-24),
    };
    writeSave(dossier);
  },
  pulse: () => set({ pulseId: get().pulseId + 1 }),
  setStage: (stage) => set({ stage }),
  setSeed: (id) => {
    set({ seedId: id, pulseId: get().pulseId + 1 });
  },
  setVoice: (id) => {
    set({ voiceId: id, pulseId: get().pulseId + 1 });
  },
  toggleMandate: (id) => {
    const current = get().mandates;
    const has = current.includes(id);
    set({
      mandates: has ? current.filter((m) => m !== id) : [...current, id],
      pulseId: get().pulseId + 1,
    });
  },
  setTrait: (key, value) => {
    set({ traits: { ...get().traits, [key]: clamp01(value) } });
  },
  setName: (name) => set({ name: name.slice(0, 32) }),
  setCallsign: (callsign) =>
    set({
      callsign: callsign
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "")
        .slice(0, 8),
    }),
  setTrace: (trace) => set({ trace: trace.slice(0, 600) }),
  setAnonymous: (anonymous) => set({ anonymous }),
  ignite: () =>
    set({ ignitedAt: Date.now(), stage: "desk", pulseId: get().pulseId + 1 }),
  pushMessage: (msg) => set({ messages: [...get().messages, msg].slice(-24) }),
  reforge: () => {
    clearSave();
    const next = blankDossier();
    set({ ...next, hydrated: true, pulseId: get().pulseId + 1 });
  },
}));
