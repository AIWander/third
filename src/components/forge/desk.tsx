import {
  redirectToLoginIfRequired,
  useRefetchWhenConnectorReady,
  type ConnectorWaitStatus,
} from "@/lib/app-data";
import { playTick } from "@/lib/audio";
import { MANDATES, SEEDS, TRAIT_META, VOICES, traitBand, type TraitKey } from "@/lib/clone/catalog";
import { reachLabels } from "@/lib/clone/hands";
import { BRIEFING_PROMPT, identityLine } from "@/lib/clone/prompt";
import { speakAsClone } from "@/lib/clone/speak";
import { useCloneStore } from "@/lib/clone/store";
import type { CloneDossier } from "@/lib/clone/types";
import { Button } from "@/components/ui/button";
import { MuteControl } from "./chambers";
import { cn } from "@/lib/utils";
import { ArrowUp, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

const REACH_ASKS = [
  {
    channel: "Calendar",
    label: "What's on my calendar",
    prompt: "What's on my calendar over the next few days?",
  },
  {
    channel: "Mail",
    label: "Unread mail",
    prompt: "What's unread in my inbox that's actually important?",
  },
  {
    channel: "Drive",
    label: "Search my files",
    prompt: "Search my files for anything I was last working on.",
  },
] as const;

function snapshot(): CloneDossier {
  const s = useCloneStore.getState();
  return {
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
    messages: s.messages,
  };
}

function statusLine(
  pending: boolean,
  waitStatus: ConnectorWaitStatus,
): string | null {
  if (waitStatus === "waiting") return "Reaching…";
  if (waitStatus === "not_embedded") {
    return "Open this app from Grok to load your data.";
  }
  if (waitStatus === "timed_out") {
    return "The hands are still connecting. Ask again in a moment.";
  }
  if (pending) return "Opening the channel…";
  return null;
}

export function DeskView() {
  const messages = useCloneStore((s) => s.messages);
  const pushMessage = useCloneStore((s) => s.pushMessage);
  const persist = useCloneStore((s) => s.persist);
  const reforge = useCloneStore((s) => s.reforge);
  const dossier = useCloneStore(
    useShallow((s) => ({
      anonymous: s.anonymous,
      name: s.name,
      callsign: s.callsign,
      seedId: s.seedId,
      voiceId: s.voiceId,
      mandates: s.mandates,
      traits: s.traits,
      trace: s.trace,
    })),
  );
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmForge, setConfirmForge] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [loginUrl, setLoginUrl] = useState<string | undefined>();
  const [waitingHands, setWaitingHands] = useState(false);
  const lastAsk = useRef("");
  const scroller = useRef<HTMLDivElement>(null);
  const seed = SEEDS.find((x) => x.id === dossier.seedId);
  const voice = VOICES.find((x) => x.id === dossier.voiceId);
  const channels = reachLabels(dossier.mandates);
  const asks = REACH_ASKS.filter((ask) => channels.includes(ask.channel));

  const waitStatus = useRefetchWhenConnectorReady(waitingHands, () => {
    if (lastAsk.current) void send(lastAsk.current, { silent: true });
  });
  const liveStatus = statusLine(pending, waitStatus);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, pending, liveStatus, loginUrl]);

  async function send(text: string, opts?: { silent?: boolean }) {
    const message = text.trim();
    if (!message || pending) return;
    playTick();
    setDraft("");
    setError(null);
    setLoginUrl(undefined);
    lastAsk.current = message;
    const d = snapshot();
    const visible =
      message === BRIEFING_PROMPT ? "Briefing requested." : message;
    if (!opts?.silent) {
      pushMessage({ role: "you", text: visible });
    }
    setPending(true);
    try {
      const result = await speakAsClone({
        data: {
          message,
          dossier: d,
          history: d.messages,
        },
      });
      if (result.ok) {
        pushMessage({
          role: "hand",
          text: result.text,
          reach: result.reaches.length ? result.reaches : undefined,
        });
        if (result.loginRequired) {
          setLoginUrl(result.loginUrl);
        }
        setWaitingHands(Boolean(result.pending));
      } else {
        setError(result.error);
        if (result.loginRequired) setLoginUrl(result.loginUrl);
        setWaitingHands(Boolean(result.pending));
      }
    } catch {
      setError("The channel dropped.");
      setWaitingHands(false);
    } finally {
      setPending(false);
      persist();
    }
  }

  function exportDossier() {
    const blob = new Blob([JSON.stringify(snapshot(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dossier.callsign.toLowerCase()}-third.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col md:flex-row md:items-stretch md:justify-end">
      <header className="pointer-events-auto flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] md:absolute md:inset-x-0 md:top-0">
        <div>
          <p className="text-xs tracking-mark text-muted uppercase">Channel open</p>
          <h2 className="font-display text-2xl text-fg">
            {identityLine(dossier)}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <MuteControl />
        </div>
      </header>

      <aside className="pointer-events-auto mt-4 flex max-h-[58%] min-h-0 flex-1 flex-col border-t border-border bg-bg/92 md:mt-0 md:h-full md:max-h-none md:w-[min(100%,28rem)] md:border-l md:border-t-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setDossierOpen((v) => !v)}
            className="text-xs tracking-mark text-muted uppercase hover:text-fg"
          >
            {dossierOpen ? "Hide dossier" : "Dossier"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportDossier}
              className="text-xs tracking-mark text-muted uppercase hover:text-fg"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => setConfirmForge(true)}
              className="inline-flex items-center gap-1 text-xs tracking-mark text-muted uppercase hover:text-fg"
            >
              <RotateCcw className="size-3" />
              Re-forge
            </button>
          </div>
        </div>

        {dossierOpen ? (
          <div className="overflow-y-auto border-b border-border px-4 py-3 text-sm">
            <p className="text-fg">
              {seed?.title} · {voice?.title}
            </p>
            <p className="mt-1 text-muted">{seed?.doctrine}</p>
            <ul className="mt-3 space-y-1 text-muted">
              {dossier.mandates.map((id) => {
                const m = MANDATES.find((x) => x.id === id);
                return <li key={id}>{m?.title}</li>;
              })}
            </ul>
            {channels.length ? (
              <p className="mt-3 text-xs tracking-mark text-faint uppercase">
                Live reach · {channels.join(" · ")}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted">
                No live reach. Re-forge and authorize a hand.
              </p>
            )}
            <ul className="mt-3 space-y-1 text-muted">
              {(Object.keys(TRAIT_META) as TraitKey[]).map((key) => (
                <li key={key}>
                  {TRAIT_META[key].label}: {traitBand(key, dossier.traits[key])}
                </li>
              ))}
            </ul>
            {dossier.trace ? (
              <p className="mt-3 italic text-fg/80">{dossier.trace}</p>
            ) : null}
          </div>
        ) : null}

        <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !pending && waitStatus === "idle" ? (
            <div className="max-w-sm">
              <p className="font-display text-2xl text-fg">Online.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {channels.length
                  ? `The third hand is assembled. It can reach ${channels
                      .join(", ")
                      .toLowerCase()} through the hands you authorized.`
                  : "The third hand is assembled, but no live channels are authorized."}
              </p>
              <Button
                className="mt-5 w-full"
                onClick={() => void send(BRIEFING_PROMPT)}
              >
                Request briefing
              </Button>
              {asks.length ? (
                <div className="mt-3 flex flex-col gap-2">
                  {asks.map((ask) => (
                    <Button
                      key={ask.channel}
                      variant="ghost"
                      className="w-full"
                      onClick={() => void send(ask.prompt)}
                    >
                      {ask.label}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-4">
              {messages.map((m, i) => (
                <li
                  key={`${m.role}-${i}`}
                  className={cn(
                    "max-w-[42rem] text-sm leading-relaxed",
                    m.role === "you" ? "ml-auto text-muted" : "text-fg",
                  )}
                >
                  <p className="mb-1 text-xs tracking-mark text-faint uppercase">
                    {m.role === "you" ? "Operator" : dossier.callsign}
                  </p>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.reach?.length ? (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {m.reach.map((r) => (
                        <span
                          key={r}
                          className="rounded-btn border border-border px-2 py-0.5 text-xs tracking-mark text-muted uppercase"
                        >
                          {r}
                        </span>
                      ))}
                    </p>
                  ) : null}
                </li>
              ))}
              {liveStatus ? (
                <li className="text-sm text-muted">{liveStatus}</li>
              ) : null}
              {loginUrl ? (
                <li>
                  <Button
                    className="w-full"
                    onClick={() =>
                      redirectToLoginIfRequired({
                        ok: false,
                        data: null,
                        loginRequired: true,
                        loginUrl,
                      })
                    }
                  >
                    Continue with Grok to load your data.
                  </Button>
                </li>
              ) : null}
              {error ? (
                <li className="text-sm text-danger">{error}</li>
              ) : null}
            </ul>
          )}
        </div>

        <form
          className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              rows={2}
              placeholder="Speak to the third hand"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-card border border-border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            />
            <Button
              type="submit"
              size="md"
              disabled={pending || !draft.trim()}
              aria-label="Send"
              className="shrink-0 px-0 w-11"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </form>
      </aside>

      {confirmForge ? (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-bg/70 px-6">
          <div className="w-full max-w-sm rounded-panel border border-border bg-surface p-6">
            <h3 className="font-display text-2xl text-fg">Re-forge?</h3>
            <p className="mt-2 text-sm text-muted">
              This dissolves the current third hand and returns you to the vault.
            </p>
            <div className="mt-6 flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setConfirmForge(false)}
              >
                Keep it
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setConfirmForge(false);
                  reforge();
                }}
              >
                Dissolve
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
