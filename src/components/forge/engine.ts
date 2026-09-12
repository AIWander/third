import * as THREE from "three";
import type { SeedId } from "@/lib/clone/types";

const BG = 0x07080a;
const NEURAL = 0xb7c4cc;
const CORE = 0xe8ece8;

export type ForgeVisual = {
  formation: number;
  seedId: SeedId | null;
  autonomy: number;
  reading: number;
  heat: number;
  shadow: number;
  pulseId: number;
  ignited: boolean;
  reduced: boolean;
};

function rand(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function gauss(i: number, salt: number): number {
  const u1 = Math.max(rand(i, salt), 1e-6);
  const u2 = rand(i, salt + 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(Math.PI * 2 * u2);
}

function writeHuman(out: Float32Array, i: number, seed: SeedId | null): void {
  const u = rand(i, 1);
  let x = 0;
  let y = 0;
  let z = 0;

  if (u < 0.13) {
    x = gauss(i, 2) * 0.13;
    y = 1.62 + gauss(i, 3) * 0.12;
    z = gauss(i, 4) * 0.11;
  } else if (u < 0.18) {
    x = gauss(i, 2) * 0.055;
    y = 1.46 + rand(i, 5) * 0.1;
    z = gauss(i, 4) * 0.05;
  } else if (u < 0.48) {
    const t = rand(i, 6);
    y = 0.82 + t * 0.62;
    const width = 0.2 + (1 - Math.abs(t - 0.45) * 1.4) * 0.1;
    x = gauss(i, 2) * width;
    z = gauss(i, 4) * 0.1;
  } else if (u < 0.68) {
    const side = rand(i, 7) < 0.5 ? -1 : 1;
    const t = rand(i, 8);
    y = 1.32 - t * 0.55;
    x = side * (0.28 + t * 0.13) + gauss(i, 2) * 0.04;
    z = gauss(i, 4) * 0.06 + t * 0.05;
    if (t > 0.78) {
      x += gauss(i, 11) * 0.05;
      y += gauss(i, 12) * 0.035;
    }
  } else {
    const side = rand(i, 7) < 0.5 ? -1 : 1;
    const t = rand(i, 9);
    y = 0.82 - t * 0.78;
    x = side * (0.09 + t * 0.045) + gauss(i, 2) * 0.035;
    z = gauss(i, 4) * 0.05;
  }

  if (seed === "precision") {
    x = Math.round(x * 18) / 18;
    y = Math.round(y * 18) / 18;
    z = Math.round(z * 18) / 18;
  } else if (seed === "architect") {
    x = Math.round(x * 8) / 8;
    y = Math.round(y * 10) / 10;
    z = Math.round(z * 8) / 8;
  } else if (seed === "instinct") {
    x *= 1.08;
    z += Math.sin(i * 0.7) * 0.045;
    y += (rand(i, 20) - 0.5) * 0.06;
  } else if (seed === "ghost") {
    x *= 0.84;
    z *= 0.68;
    y += 0.04;
  } else if (seed === "fire") {
    y *= 1.07;
    x *= 0.9;
    z *= 0.92;
  }

  const ix = i * 3;
  out[ix] = x;
  out[ix + 1] = y;
  out[ix + 2] = z;
}

function writeCloud(out: Float32Array, i: number): void {
  const theta = rand(i, 30) * Math.PI * 2;
  const phi = Math.acos(2 * rand(i, 31) - 1);
  const r = 1.4 * Math.cbrt(rand(i, 32));
  const ix = i * 3;
  out[ix] = r * Math.sin(phi) * Math.cos(theta);
  out[ix + 1] = 1.0 + r * Math.cos(phi) * 0.72;
  out[ix + 2] = r * Math.sin(phi) * Math.sin(theta);
}

export type ForgeHandle = {
  setVisual: (v: ForgeVisual) => void;
  dispose: () => void;
};

export function mountForge(canvas: HTMLCanvasElement): ForgeHandle {
  const count = canvas.clientWidth < 480 ? 620 : 980;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(BG, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 5.2, 13);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
  camera.position.set(0, 1.15, 4.4);

  const human = new Float32Array(count * 3);
  const cloud = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    writeCloud(cloud, i);
    writeHuman(human, i, null);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const pointsMat = new THREE.PointsMaterial({
    size: 0.042,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geom, pointsMat);
  scene.add(points);

  const pairCount = Math.floor(count * 1.35);
  const pairs = new Uint16Array(pairCount * 2);
  for (let i = 0; i < count; i++) {
    const a = i * 2;
    if (a + 1 < pairs.length) {
      pairs[a] = i;
      pairs[a + 1] = (i + 1) % count;
    }
  }
  for (let i = 0; i < pairCount - count; i++) {
    const a = (count + i) * 2;
    if (a + 1 < pairs.length) {
      pairs[a] = i % count;
      pairs[a + 1] = (i + 29) % count;
    }
  }
  const linePos = new Float32Array(pairCount * 2 * 3);
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: NEURAL,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeom, lineMat);
  scene.add(lines);

  const coreGeom = new THREE.IcosahedronGeometry(0.15, 1);
  const coreMat = new THREE.MeshBasicMaterial({
    color: CORE,
    wireframe: true,
    transparent: true,
    opacity: 0.28,
  });
  const core = new THREE.Mesh(coreGeom, coreMat);
  core.position.set(0, 1.08, 0);
  scene.add(core);

  const ringGeom = new THREE.TorusGeometry(1.18, 0.007, 12, 96);
  const ringMat = new THREE.MeshBasicMaterial({
    color: NEURAL,
    transparent: true,
    opacity: 0.28,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  const ring2 = ring.clone();
  ring2.scale.setScalar(1.18);
  ring2.material = ringMat.clone();
  (ring2.material as THREE.MeshBasicMaterial).opacity = 0.12;
  scene.add(ring2);

  const scanGeom = new THREE.PlaneGeometry(2.6, 0.018);
  const scanMat = new THREE.MeshBasicMaterial({
    color: CORE,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const scan = new THREE.Mesh(scanGeom, scanMat);
  scan.position.set(0, 0.4, 0);
  scene.add(scan);

  let visual: ForgeVisual = {
    formation: 0.07,
    seedId: null,
    autonomy: 0.46,
    reading: 0.42,
    heat: 0.38,
    shadow: 0.55,
    pulseId: 0,
    ignited: false,
    reduced: false,
  };
  let lastPulse = 0;
  let form = 0.07;
  let burst = 0;
  let angle = 0.35;
  let lastSeed: SeedId | null | undefined = undefined;
  let last = performance.now();
  let raf = 0;
  let disposed = false;

  function resize(): void {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const nr = ((NEURAL >> 16) & 255) / 255;
  const ng = ((NEURAL >> 8) & 255) / 255;
  const nb = (NEURAL & 255) / 255;
  const cr = ((CORE >> 16) & 255) / 255;
  const cg = ((CORE >> 8) & 255) / 255;
  const cb = (CORE & 255) / 255;

  function tick(now: number): void {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    const raw = (now - last) / 1000;
    last = now;
    const dt = Math.min(raw, 0.1);
    if (document.hidden) return;

    if (lastSeed !== visual.seedId) {
      lastSeed = visual.seedId;
      for (let i = 0; i < count; i++) writeHuman(human, i, visual.seedId);
    }
    if (visual.pulseId !== lastPulse) {
      lastPulse = visual.pulseId;
      burst = 1;
    }

    const target = visual.formation;
    form += (target - form) * (1 - Math.exp(-3.1 * dt));
    burst *= Math.exp(-3.4 * dt);

    const reading = visual.reading;
    const auto = visual.autonomy;
    const heat = visual.heat;
    const shadow = visual.shadow;
    const t = now * 0.001;
    const mix = Math.min(1, Math.max(0, form + burst * 0.05));

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const hx = human[ix]!;
      const hy = human[ix + 1]!;
      const hz = human[ix + 2]!;
      const cx = cloud[ix]!;
      const cy = cloud[ix + 1]!;
      const cz = cloud[ix + 2]!;
      let x = cx + (hx - cx) * mix;
      let y = cy + (hy - cy) * mix;
      let z = cz + (hz - cz) * mix;

      const wander = reading * 0.18;
      x += Math.sin(t * (0.6 + heat) + i * 0.31) * wander;
      z += Math.cos(t * (0.5 + heat * 0.8) + i * 0.19) * wander;
      y += Math.sin(t * 0.7 + i * 0.11) * wander * 0.35;

      const orbit = auto * 0.22;
      const oa = t * (0.25 + auto * 0.4) + i * 0.017;
      x += Math.cos(oa) * orbit * (0.4 + rand(i, 40));
      z += Math.sin(oa) * orbit * (0.4 + rand(i, 41));

      const drop = rand(i, 55) < shadow * 0.42;
      if (drop) y = -8;

      const jitter = heat * 0.045;
      x += Math.sin(t * 9.1 + i * 1.7) * jitter;
      y += Math.cos(t * 7.4 + i * 1.3) * jitter * 0.6;
      z += Math.sin(t * 6.2 + i * 2.1) * jitter;

      positions[ix] = x;
      positions[ix + 1] = y;
      positions[ix + 2] = z;

      const lift = 0.35 + heat * 0.45 + burst * 0.25;
      colors[ix] = nr + (cr - nr) * lift;
      colors[ix + 1] = ng + (cg - ng) * lift;
      colors[ix + 2] = nb + (cb - nb) * lift;
    }

    geom.attributes.position!.needsUpdate = true;
    geom.attributes.color!.needsUpdate = true;

    const lineMix = 0.05 + mix * 0.16;
    lineMat.opacity = lineMix;
    let lp = 0;
    for (let p = 0; p < pairCount; p++) {
      const a = pairs[p * 2]!;
      const b = pairs[p * 2 + 1]!;
      const ax = positions[a * 3]!;
      const ay = positions[a * 3 + 1]!;
      const az = positions[a * 3 + 2]!;
      const bx = positions[b * 3]!;
      const by = positions[b * 3 + 1]!;
      const bz = positions[b * 3 + 2]!;
      linePos[lp++] = ax;
      linePos[lp++] = ay;
      linePos[lp++] = az;
      linePos[lp++] = bx;
      linePos[lp++] = by;
      linePos[lp++] = bz;
    }
    lineGeom.attributes.position!.needsUpdate = true;

    core.rotation.y += dt * (0.15 + heat * 0.4);
    core.rotation.x += dt * 0.08;
    const coreScale = 0.85 + mix * 0.45 + burst * 0.2 + (visual.ignited ? 0.12 : 0);
    core.scale.setScalar(coreScale);
    coreMat.opacity = 0.18 + mix * 0.35 + burst * 0.3;

    ring.rotation.z += dt * 0.12;
    ring2.rotation.z -= dt * 0.07;
    ringMat.opacity = 0.14 + mix * 0.2;

    if (burst > 0.02) {
      scanMat.opacity = burst * 0.55;
      scan.position.y = 0.15 + (1 - burst) * 1.7;
    } else {
      scanMat.opacity = 0;
    }

    const spin = visual.reduced ? 0 : 0.11;
    angle += dt * spin;
    const radius = 4.45 - mix * 0.7;
    const camY = 1.08 + Math.sin(t * 0.35) * (visual.reduced ? 0 : 0.1);
    camera.position.set(Math.sin(angle) * radius, camY, Math.cos(angle) * radius);
    camera.lookAt(0, 1.02, 0);

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(tick);

  return {
    setVisual(v) {
      visual = v;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      geom.dispose();
      pointsMat.dispose();
      lineGeom.dispose();
      lineMat.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      (ring2.material as THREE.Material).dispose();
      scanGeom.dispose();
      scanMat.dispose();
      renderer.dispose();
    },
  };
}
