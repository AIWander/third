import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  ChevronLeft,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playIgnite, playLock, playTick, setMuted, startDrone, toggleMuted } from "@/lib/audio";
import {
  CHAMBER_COPY,
  IGNITION_BEATS,
  MANDATES,
  SEEDS,
  TRAIT_META,
  VOICES,
  traitBand,
  type TraitKey,
} from "@/lib/clone/catalog";
import { useCloneStore } from "@/lib/clone/store";
import type { Stage } from "@/lib/clone/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CHAMBER_STAGES: Stage[] = [
  "seed",
  "voice",
  "mandate",
  "lattice",
  "bond",
  "ignition",
];

function isTypingTarget(el: EventTarget | null): boolean {
  const tag = (el as HTMLElement | null)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
}

export function MuteControl() {
  const [muted, setMutedState] = useState(false);
  return (
    <button
      type="button"
      aria-label={muted ? "Unmute" : "Mute"}
      onClick={() => setMutedState(toggleMuted())}
      className="inline-flex size-11 items-center justify-center rounded-btn border border-border bg-surface text-muted hover:text-fg"
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </button>
  );
}

function Rail({ stage }: { stage: Stage }) {
  const idx = CHAMBER_STAGES.indexOf(stage);
  return (
    <ol className="flex items-center gap-1.5 overflow-x-auto">
      {CHAMBER_STAGES.map((s, i) => (
        <li
          key={s}
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            i < idx && "bg-accent",
            i === idx && "bg-fg",
            i > idx && "bg-border",
          )}
          aria-current={i === idx ? "step" : undefined}
        />
      ))}
    </ol>
  );
}

function Dock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 max-h-[62%] overflow-y-auto border-t border-border bg-bg/92 px-4 pt-4 pb-24",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Header({
  stage,
  onBack,
}: {
  stage: Stage;
  onBack?: () => void;
}) {
  const copy =
    stage in CHAMBER_COPY
      ? CHAMBER_COPY[stage as keyof typeof CHAMBER_COPY]
      : null;
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-start gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="inline-flex size-11 items-center justify-center rounded-btn border border-border bg-surface text-fg"
          >
            <ChevronLeft className="size-4" />
          </button>
        ) : (
          <div className="size-11" />
        )}
        {copy ? (
          <div className="pt-1">
            <p className="text-xs tracking-mark text-muted uppercase">
              {copy.mark}
            </p>
            <h2 className="title-chamber mt-1 text-fg">{copy.title}</h2>
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-3">
        <MuteControl />
        {stage !== "ingress" && stage !== "desk" ? <Rail stage={stage} /> : null}
      </div>
    </header>
  );
}

export function IngressView() {
  const setStage = useCloneStore((s) => s.setStage);
  return (
    <div className="relative flex h-full flex-col justify-end px-6 pb-24 md:px-10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-bg via-bg/80 to-transparent" />
      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-20">
        <MuteControl />
      </div>
      <div className="relative z-10 w-full max-w-lg">
        <p className="text-xs tracking-mark text-muted uppercase">
          Third party · anonymous · autonomous
        </p>
        <h1 className="title-display mt-4 text-fg italic">A third hand.</h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
          You are about to forge a clone of yourself. Not a chatbot — a third
          hand. It has no name unless you give it one. Six chambers. One
          ignition.
        </p>
        <Button
          className="mt-8 w-full sm:w-auto"
          size="xl"
          onClick={() => {
            setMuted(false);
            startDrone();
            playLock();
            setStage("seed");
          }}
        >
          Enter the forge
        </Button>
      </div>
    </div>
  );
}

function SeedView() {
  const seedId = useCloneStore((s) => s.seedId);
  const setSeed = useCloneStore((s) => s.setSeed);
  const setStage = useCloneStore((s) => s.setStage);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= SEEDS.length) {
        const card = SEEDS[n - 1];
        if (card) {
          playTick();
          setSeed(card.id);
        }
      }
      if (e.key === "Enter" && seedId) setStage("voice");
      if (e.key === "Escape") setStage("ingress");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seedId, setSeed, setStage]);

  return (
    <>
      <Header stage="seed" onBack={() => setStage("ingress")} />
      <Dock>
        <p className="mb-3 text-sm text-muted">{CHAMBER_COPY.seed.line}</p>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible">
          {SEEDS.map((card, i) => {
            const selected = seedId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  playTick();
                  setSeed(card.id);
                }}
                className={cn(
                  "relative min-h-44 min-w-[78%] snap-center overflow-hidden rounded-card border text-left transition-[transform,border-color] duration-200 md:min-w-0",
                  selected ? "border-accent" : "border-border hover:border-fg/25",
                )}
              >
                <img
                  src={card.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/10" />
                <div className="relative z-10 flex h-full min-h-44 flex-col justify-end p-4">
                  <p className="text-xs tracking-mark text-muted uppercase">
                    {String(i + 1).padStart(2, "0")} · {card.epithet}
                  </p>
                  <h3 className="mt-1 font-display text-2xl text-fg">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{card.doctrine}</p>
                </div>
              </button>
            );
          })}
        </div>
        <Button
          className="mt-4 w-full"
          disabled={!seedId}
          onClick={() => {
            playLock();
            setStage("voice");
          }}
        >
          Lock temperament
        </Button>
        <p className="mt-2 hidden text-xs text-faint md:block">
          Keys 1–5 · Enter
        </p>
      </Dock>
    </>
  );
}

function VoiceView() {
  const voiceId = useCloneStore((s) => s.voiceId);
  const setVoice = useCloneStore((s) => s.setVoice);
  const setStage = useCloneStore((s) => s.setStage);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= VOICES.length) {
        const card = VOICES[n - 1];
        if (card) {
          playTick();
          setVoice(card.id);
        }
      }
      if (e.key === "Enter" && voiceId) setStage("mandate");
      if (e.key === "Escape") setStage("seed");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [voiceId, setVoice, setStage]);

  return (
    <>
      <Header stage="voice" onBack={() => setStage("seed")} />
      <Dock>
        <p className="mb-3 text-sm text-muted">{CHAMBER_COPY.voice.line}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {VOICES.map((card, i) => {
            const selected = voiceId === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  playTick();
                  setVoice(card.id);
                }}
                className={cn(
                  "flex min-h-28 flex-col items-start rounded-card border p-4 text-left transition-colors",
                  selected ? "border-accent bg-surface" : "border-border bg-bg hover:border-fg/25",
                )}
              >
                <p className="text-xs tracking-mark text-muted uppercase">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-xl text-fg">{card.title}</h3>
                <p className="mt-1 text-sm text-muted">{card.doctrine}</p>
                <p className="mt-3 text-sm italic text-fg/80">{card.sample}</p>
              </button>
            );
          })}
        </div>
        <Button
          className="mt-4 w-full"
          disabled={!voiceId}
          onClick={() => {
            playLock();
            setStage("mandate");
          }}
        >
          Bind voice
        </Button>
      </Dock>
    </>
  );
}

function MandateView() {
  const mandates = useCloneStore((s) => s.mandates);
  const toggleMandate = useCloneStore((s) => s.toggleMandate);
  const setStage = useCloneStore((s) => s.setStage);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= MANDATES.length) {
        const card = MANDATES[n - 1];
        if (card) {
          playTick();
          toggleMandate(card.id);
        }
      }
      if (e.key === "Enter" && mandates.length > 0) setStage("lattice");
      if (e.key === "Escape") setStage("voice");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mandates.length, toggleMandate, setStage]);

  return (
    <>
      <Header stage="mandate" onBack={() => setStage("voice")} />
      <Dock>
        <p className="mb-3 text-sm text-muted">{CHAMBER_COPY.mandate.line}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MANDATES.map((card, i) => {
            const selected = mandates.includes(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  playTick();
                  toggleMandate(card.id);
                }}
                className={cn(
                  "flex min-h-20 items-start gap-3 rounded-card border p-4 text-left transition-colors",
                  selected ? "border-accent bg-surface" : "border-border hover:border-fg/25",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border text-transparent",
                  )}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-xs tracking-mark text-muted uppercase">
                    {String(i + 1).padStart(2, "0")} · Hand
                  </span>
                  <span className="mt-1 block font-medium text-fg">{card.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">
                    {card.doctrine}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <Button
          className="mt-4 w-full"
          disabled={mandates.length === 0}
          onClick={() => {
            playLock();
            setStage("lattice");
          }}
        >
          Authorize hands
        </Button>
      </Dock>
    </>
  );
}

function LatticeView() {
  const traits = useCloneStore((s) => s.traits);
  const setTrait = useCloneStore((s) => s.setTrait);
  const pulse = useCloneStore((s) => s.pulse);
  const setStage = useCloneStore((s) => s.setStage);
  const keys = Object.keys(TRAIT_META) as TraitKey[];

  return (
    <>
      <Header stage="lattice" onBack={() => setStage("mandate")} />
      <Dock className="md:max-h-[50%]">
        <p className="mb-3 text-sm text-muted">{CHAMBER_COPY.lattice.line}</p>
        <div className="grid gap-5">
          {keys.map((key) => {
            const meta = TRAIT_META[key];
            const value = traits[key];
            return (
              <label key={key} className="block">
                <span className="flex items-baseline justify-between gap-3">
                  <span>
                    <span className="block text-sm font-medium text-fg">
                      {meta.label}
                    </span>
                    <span className="block text-sm text-muted">{meta.doctrine}</span>
                  </span>
                  <span className="text-xs tracking-mark text-accent uppercase tabular-nums">
                    {traitBand(key, value)}
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(value * 100)}
                  aria-label={meta.label}
                  onChange={(e) => {
                    setTrait(key, Number(e.target.value) / 100);
                  }}
                  onPointerUp={pulse}
                  className="mt-3"
                />
                <span className="mt-1 flex justify-between text-xs text-faint">
                  <span>{meta.left}</span>
                  <span>{meta.right}</span>
                </span>
              </label>
            );
          })}
        </div>
        <Button
          className="mt-5 w-full"
          onClick={() => {
            playLock();
            setStage("bond");
          }}
        >
          Seal the lattice
        </Button>
      </Dock>
    </>
  );
}

function BondView() {
  const name = useCloneStore((s) => s.name);
  const callsign = useCloneStore((s) => s.callsign);
  const trace = useCloneStore((s) => s.trace);
  const anonymous = useCloneStore((s) => s.anonymous);
  const setName = useCloneStore((s) => s.setName);
  const setCallsign = useCloneStore((s) => s.setCallsign);
  const setTrace = useCloneStore((s) => s.setTrace);
  const setAnonymous = useCloneStore((s) => s.setAnonymous);
  const setStage = useCloneStore((s) => s.setStage);

  const field =
    "h-11 w-full rounded-btn border border-border bg-surface px-3 text-sm text-fg placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

  return (
    <>
      <Header stage="bond" onBack={() => setStage("lattice")} />
      <Dock className="md:max-w-xl md:left-1/2 md:-translate-x-1/2 md:border-x">
        <p className="mb-4 text-sm text-muted">{CHAMBER_COPY.bond.line}</p>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-card border border-border bg-surface px-4">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="size-4 accent-accent"
          />
          <span>
            <span className="block text-sm font-medium text-fg">Remain unnamed</span>
            <span className="block text-sm text-muted">
              A third party with no name. Call-sign only.
            </span>
          </span>
        </label>
        {!anonymous ? (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs tracking-mark text-muted uppercase">
              Name
            </span>
            <input
              className={field}
              value={name}
              maxLength={32}
              placeholder="A name you will say out loud"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        ) : null}
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs tracking-mark text-muted uppercase">
            Call-sign
          </span>
          <input
            className={cn(field, "uppercase tracking-widest")}
            value={callsign}
            maxLength={8}
            placeholder="VELA"
            onChange={(e) => setCallsign(e.target.value)}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs tracking-mark text-muted uppercase">
            How you actually operate
          </span>
          <textarea
            className="min-h-28 w-full resize-y rounded-card border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-fg placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            value={trace}
            maxLength={600}
            placeholder="I decide fast, then check the work. I hate fluff. I care about…"
            onChange={(e) => setTrace(e.target.value)}
          />
        </label>
        <Button
          className="mt-4 w-full"
          disabled={!callsign}
          onClick={() => {
            playLock();
            playIgnite();
            setStage("ignition");
          }}
        >
          Write the bond
        </Button>
      </Dock>
    </>
  );
}

function IgnitionView() {
  const [beat, setBeat] = useState(0);
  const pulse = useCloneStore((s) => s.pulse);
  const ignite = useCloneStore((s) => s.ignite);
  const setStage = useCloneStore((s) => s.setStage);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) {
      ignite();
      return;
    }
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setBeat(Math.min(n, IGNITION_BEATS.length - 1));
      pulse();
      if (n >= IGNITION_BEATS.length - 1) {
        window.clearInterval(id);
        window.setTimeout(() => ignite(), 900);
      }
    }, 720);
    return () => window.clearInterval(id);
  }, [ignite, pulse, reduced]);

  return (
    <>
      <Header stage="ignition" onBack={() => setStage("bond")} />
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-6 pb-[max(4rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-xs tracking-mark text-muted uppercase">Ritual</p>
        <h2 className="title-chamber mt-3 text-fg">
          {IGNITION_BEATS[beat]}
        </h2>
        <Button
          variant="ghost"
          className="mt-8"
          onClick={() => ignite()}
        >
          Skip ritual
        </Button>
      </div>
    </>
  );
}

export function ForgeOverlay() {
  const stage = useCloneStore((s) => s.stage);
  if (stage === "ingress") return <IngressView />;
  if (stage === "seed") return <SeedView />;
  if (stage === "voice") return <VoiceView />;
  if (stage === "mandate") return <MandateView />;
  if (stage === "lattice") return <LatticeView />;
  if (stage === "bond") return <BondView />;
  if (stage === "ignition") return <IgnitionView />;
  return null;
}
