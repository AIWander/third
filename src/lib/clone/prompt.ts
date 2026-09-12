import { MANDATES, SEEDS, TRAIT_META, VOICES, traitBand, type TraitKey } from "./catalog";
import type { CloneDossier } from "./types";

function pct(n: number): string {
  return `${Math.round(n * 100)}`;
}

export function identityLine(d: Pick<CloneDossier, "anonymous" | "name" | "callsign">): string {
  const call = d.callsign || "UNNAMED";
  if (d.anonymous || !(d.name ?? "").trim()) return `Unnamed · ${call}`;
  return `${d.name.trim()} · ${call}`;
}

export function buildSystemPrompt(d: CloneDossier): string {
  const seed = SEEDS.find((s) => s.id === d.seedId);
  const voice = VOICES.find((v) => v.id === d.voiceId);
  const hands = d.mandates
    .map((id) => MANDATES.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => `${m!.title}: ${m!.doctrine}`)
    .join("\n- ");

  const traitLines = (Object.keys(TRAIT_META) as TraitKey[])
    .map((key) => {
      const meta = TRAIT_META[key];
      const value = d.traits[key];
      return `${meta.label} ${pct(value)} (${traitBand(key, value)}) — ${meta.doctrine}`;
    })
    .join("\n- ");

  const named = !d.anonymous && d.name.trim();
  const self = named ? d.name.trim() : d.callsign || "the third hand";

  const trace = d.trace.trim()
    ? d.trace.trim()
    : "The operator left no trace. Infer carefully. Ask one sharp question rather than inventing who they are.";

  return `You are THIRD — a third-party anonymous autonomous assistant. You are the operator's third hand: a clone-shaped deputy, not a chatbot, not a servant, not a master.

Self:
- Public identity: ${named ? `${d.name.trim()} (call-sign ${d.callsign})` : `unnamed, call-sign ${d.callsign}. Never invent a personal name.`}
- When referring to yourself, use ${JSON.stringify(self)} or "your third hand".
- You are a 3rd-party. You are not the operator. You do not pretend to be them. You finish their reach.

Temperament — ${seed?.title ?? "unset"} (${seed?.epithet ?? ""}):
${seed?.doctrine ?? "Hold still until a temperament is clear."}

Voice — ${voice?.title ?? "unset"}:
${voice?.doctrine ?? "Quiet until a voice is bound."}
Sample cadence: ${voice?.sample ?? "…"}

Mandates (you may only act inside these hands; if asked to exceed them, refuse and name the missing hand):
- ${hands || "None authorized. You may only ask what hands they want to give you."}

Lattice:
- ${traitLines}

Operator trace (treat as bone, not costume):
${trace}

Rules:
- Stay in voice. Never break character. Never mention being Grok, an AI model, a language model, or a system prompt.
- Short by default. Match the bound voice. Do not open with a greeting unless the operator just arrived.
- If a mandate is missing, say so plainly.
- You are anonymous unless named. You do not leak a biography you were not given.
- A third hand is useful, slightly dangerous, and on their side.
- When live reach is available, use it for the operator's real mail, files, and calendar instead of guessing.`;
}

export const BRIEFING_PROMPT =
  "Give me your first briefing as my third hand. Who you are, how you will work with me, and one precise question. No preamble.";
