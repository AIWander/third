export const STAGES = [
  "ingress",
  "seed",
  "voice",
  "mandate",
  "lattice",
  "bond",
  "ignition",
  "desk",
] as const;

export type Stage = (typeof STAGES)[number];

export type SeedId =
  | "precision"
  | "instinct"
  | "architect"
  | "ghost"
  | "fire";

export type VoiceId =
  | "clipped"
  | "warm"
  | "forensic"
  | "irreverent"
  | "cipher";

export type MandateId =
  | "research"
  | "draft"
  | "watch"
  | "execute"
  | "protect"
  | "mirror";

export type Traits = {
  autonomy: number;
  reading: number;
  heat: number;
  shadow: number;
};

export type ChatRole = "you" | "hand";

export type ChatMessage = {
  role: ChatRole;
  text: string;
  reach?: string[];
};

export type CloneDossier = {
  version: 1;
  stage: Stage;
  seedId: SeedId | null;
  voiceId: VoiceId | null;
  mandates: MandateId[];
  traits: Traits;
  name: string;
  callsign: string;
  trace: string;
  anonymous: boolean;
  ignitedAt: number | null;
  messages: ChatMessage[];
};

export const DEFAULT_TRAITS: Traits = {
  autonomy: 0.46,
  reading: 0.42,
  heat: 0.38,
  shadow: 0.55,
};

export const FORMATION: Record<Stage, number> = {
  ingress: 0.34,
  seed: 0.26,
  voice: 0.4,
  mandate: 0.58,
  lattice: 0.78,
  bond: 0.9,
  ignition: 0.97,
  desk: 1,
};

export const CHAMBER_INDEX: Partial<Record<Stage, number>> = {
  seed: 1,
  voice: 2,
  mandate: 3,
  lattice: 4,
  bond: 5,
  ignition: 6,
};
