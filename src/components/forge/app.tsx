import { useEffect, useLayoutEffect } from "react";
import { installAudioUnlock, startDrone } from "@/lib/audio";
import { useCloneStore } from "@/lib/clone/store";
import { ForgeOverlay } from "./chambers";
import { DeskView } from "./desk";
import { ForgeScene } from "./scene";

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ForgeApp() {
  const stage = useCloneStore((s) => s.stage);
  const hydrated = useCloneStore((s) => s.hydrated);

  useIsoLayoutEffect(() => {
    if (!useCloneStore.getState().hydrated) {
      useCloneStore.getState().hydrate();
    }
    const unlock = installAudioUnlock();
    let timer: number | undefined;
    const unsub = useCloneStore.subscribe(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => useCloneStore.getState().persist(), 280);
    });
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        useCloneStore.getState().persist();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    const onHide = () => useCloneStore.getState().persist();
    window.addEventListener("pagehide", onHide);
    return () => {
      unlock();
      unsub();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

  useEffect(() => {
    if (hydrated && stage !== "ingress") startDrone();
  }, [hydrated, stage]);

  return (
    <main className="relative h-dvh overflow-hidden bg-bg text-fg">
      <ForgeScene />
      <div className="vignette" />
      <div className="grain" />
      {stage === "desk" ? <DeskView /> : <ForgeOverlay />}
    </main>
  );
}
