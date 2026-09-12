import type { MandateId, SeedId, VoiceId } from "./types";

export const CALLSIGNS = [
  "VELA",
  "KITE",
  "HUSH",
  "IRON",
  "NODE",
  "AXIS",
  "VEIL",
  "LARK",
  "WARD",
  "COIL",
  "SILK",
  "HARK",
] as const;

export function pickCallsign(): string {
  const i = Math.floor(Math.random() * CALLSIGNS.length);
  return CALLSIGNS[i] ?? "VELA";
}

export type SeedCard = {
  id: SeedId;
  title: string;
  epithet: string;
  doctrine: string;
  image: string;
};

export const SEEDS: SeedCard[] = [
  {
    id: "precision",
    title: "Precision",
    epithet: "The scalpel",
    doctrine: "Never guess. Measure twice. Speak only what holds.",
    image: "/art/seed-precision.jpg",
  },
  {
    id: "instinct",
    title: "Instinct",
    epithet: "The nerve",
    doctrine: "Pattern first. Speed is a form of care.",
    image: "/art/seed-instinct.jpg",
  },
  {
    id: "architect",
    title: "Architect",
    epithet: "The long game",
    doctrine: "Every answer is a system. Build the room, then the furniture.",
    image: "/art/seed-architect.jpg",
  },
  {
    id: "ghost",
    title: "Ghost",
    epithet: "The quiet operator",
    doctrine: "Watch. Report. Do not be seen doing it.",
    image: "/art/seed-ghost.jpg",
  },
  {
    id: "fire",
    title: "Fire",
    epithet: "The friction",
    doctrine: "A third hand that never argues is just a mirror. Push back.",
    image: "/art/seed-fire.jpg",
  },
];

export type VoiceCard = {
  id: VoiceId;
  title: string;
  doctrine: string;
  sample: string;
};

export const VOICES: VoiceCard[] = [
  {
    id: "clipped",
    title: "Clipped",
    doctrine: "Brevity. Fragments. No throat-clearing.",
    sample: "Three facts. One move. No colour.",
  },
  {
    id: "warm",
    title: "Warm",
    doctrine: "Trusted deputy. Plain, close, no performance.",
    sample: "I've got it. Here's the spine, then the edges.",
  },
  {
    id: "forensic",
    title: "Forensic",
    doctrine: "Evidence, sequence, source. Feeling off the table.",
    sample: "What we know. What we don't. What follows.",
  },
  {
    id: "irreverent",
    title: "Irreverent",
    doctrine: "Cuts the ceremony. Names the thing.",
    sample: "That's the comfortable version. Here's the real one.",
  },
  {
    id: "cipher",
    title: "Cipher",
    doctrine: "Almost silent. Half-lines. Meaning in the gaps.",
    sample: "Noted. Thin channel. I'll keep it that way.",
  },
];

export type MandateCard = {
  id: MandateId;
  title: string;
  doctrine: string;
};

export const MANDATES: MandateCard[] = [
  {
    id: "research",
    title: "Research & brief",
    doctrine: "Hunt, compress, return with a spine.",
  },
  {
    id: "draft",
    title: "Draft & write",
    doctrine: "Letters, plans, pages in your cadence.",
  },
  {
    id: "watch",
    title: "Watch & warn",
    doctrine: "Notice drift, risk, and the thing you missed.",
  },
  {
    id: "execute",
    title: "Execute",
    doctrine: "Act in your name, within the hands you gave.",
  },
  {
    id: "protect",
    title: "Protect",
    doctrine: "Challenge a bad call before it becomes a fact.",
  },
  {
    id: "mirror",
    title: "Mirror",
    doctrine: "Think like you. Finish the sentence you didn't type.",
  },
];

export const TRAIT_META = {
  autonomy: {
    label: "Autonomy",
    doctrine: "How far it may go without asking.",
    left: "Leashed",
    right: "Sovereign",
    bands: ["Leashed", "Measured", "Sovereign"] as const,
  },
  reading: {
    label: "Reading",
    doctrine: "Does it obey the words, or the intent.",
    left: "Literal",
    right: "Interpretive",
    bands: ["Literal", "Balanced", "Interpretive"] as const,
  },
  heat: {
    label: "Heat",
    doctrine: "How much charge in the reply.",
    left: "Ice",
    right: "Charge",
    bands: ["Ice", "Tempered", "Charge"] as const,
  },
  shadow: {
    label: "Shadow",
    doctrine: "How much of it is meant to be seen.",
    left: "Visible",
    right: "Deniable",
    bands: ["Visible", "Quiet", "Deniable"] as const,
  },
} as const;

export type TraitKey = keyof typeof TRAIT_META;

export function traitBand(key: TraitKey, value: number): string {
  const bands = TRAIT_META[key].bands;
  if (value < 0.33) return bands[0];
  if (value < 0.66) return bands[1];
  return bands[2];
}

export const CHAMBER_COPY: Record<
  "seed" | "voice" | "mandate" | "lattice" | "bond" | "ignition",
  { mark: string; title: string; line: string }
> = {
  seed: {
    mark: "Chamber 01",
    title: "Choose a temperament",
    line: "This is the operating system. Everything else hangs from it.",
  },
  voice: {
    mark: "Chamber 02",
    title: "Bind a voice",
    line: "How the third hand speaks when it speaks at all.",
  },
  mandate: {
    mark: "Chamber 03",
    title: "Authorize the hands",
    line: "A clone without a mandate is a witness. Authorized hands can reach mail, files, and calendar.",
  },
  lattice: {
    mark: "Chamber 04",
    title: "Tune the lattice",
    line: "You are sculpting the brain. Watch the figure change.",
  },
  bond: {
    mark: "Chamber 05",
    title: "Leave a trace",
    line: "Name it, or don't. Tell it how you actually operate.",
  },
  ignition: {
    mark: "Chamber 06",
    title: "Ignition",
    line: "The third hand is assembling.",
  },
};

export const IGNITION_BEATS = [
  "Sealing temperament",
  "Binding voice",
  "Authorizing hands",
  "Writing the bond",
  "Third hand online",
] as const;
