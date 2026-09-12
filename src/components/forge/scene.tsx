import { useEffect, useRef } from "react";
import { FORMATION } from "@/lib/clone/types";
import { useCloneStore } from "@/lib/clone/store";
import type { ForgeHandle, ForgeVisual } from "./engine";

function visualFromStore(): ForgeVisual {
  const s = useCloneStore.getState();
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    formation: FORMATION[s.stage],
    seedId: s.seedId,
    autonomy: s.traits.autonomy,
    reading: s.traits.reading,
    heat: s.traits.heat,
    shadow: s.traits.shadow,
    pulseId: s.pulseId,
    ignited: Boolean(s.ignitedAt),
    reduced,
  };
}

export function ForgeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ForgeHandle | null>(null);
  const stage = useCloneStore((s) => s.stage);
  const seedId = useCloneStore((s) => s.seedId);
  const traits = useCloneStore((s) => s.traits);
  const pulseId = useCloneStore((s) => s.pulseId);
  const ignitedAt = useCloneStore((s) => s.ignitedAt);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let handle: ForgeHandle | null = null;

    void import("./engine").then((mod) => {
      if (cancelled || !canvasRef.current) return;
      handle = mod.mountForge(canvasRef.current);
      handleRef.current = handle;
      handle.setVisual(visualFromStore());
    });

    return () => {
      cancelled = true;
      handle?.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setVisual(visualFromStore());
  }, [stage, seedId, traits, pulseId, ignitedAt]);

  return (
    <canvas
      ref={canvasRef}
      className="forge-canvas absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
