import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks";
import { useUI } from "@/store";
import { cn } from "@/utils/cn";

type Stop = {
  id: string;
  title: string;
  description: string;
  cam: { px: number; py: number; pz: number; tx: number; ty: number; tz: number };
};

// 12 guided viewpoints orbiting the residence.
const STOPS: Stop[] = [
  { id: "arrival", title: "The Arrival", description: "A discreet motor court framed by stone and warm landscape lighting.", cam: { px: 12, py: 3, pz: 12, tx: 0, ty: 3, tz: 0 } },
  { id: "facade", title: "The Facade", description: "Clean stone-and-glass elevation with floor-to-ceiling glazing.", cam: { px: 0, py: 4, pz: 14, tx: 0, ty: 3.5, tz: 0 } },
  { id: "entry", title: "Grand Entry", description: "A sculptural canopy leads to a double-height foyer.", cam: { px: 6, py: 2, pz: 8, tx: 0, ty: 2.5, tz: 0 } },
  { id: "tower", title: "The Tower", description: "Architectural verticality and a private corner terrace.", cam: { px: 8, py: 9, pz: 8, tx: 0, ty: 6, tz: 0 } },
  { id: "crown", title: "The Crown", description: "Rooflines and a rooftop deck above the skyline.", cam: { px: 5, py: 12, pz: 6, tx: 0, ty: 8, tz: 0 } },
  { id: "garden", title: "Garden Side", description: "Landscaped grounds cascade toward a reflecting pool.", cam: { px: -8, py: 3, pz: 9, tx: 0, ty: 2.5, tz: 0 } },
  { id: "pool", title: "The Pool Deck", description: "An infinity edge meets the horizon at dusk.", cam: { px: -11, py: 2, pz: 4, tx: 0, ty: 2, tz: 0 } },
  { id: "wing", title: "The East Wing", description: "Bedroom suites wrapped in bronze fins and glass.", cam: { px: 10, py: 5, pz: -6, tx: 0, ty: 4, tz: 0 } },
  { id: "terrace", title: "Sunset Terrace", description: "West-facing outdoor living with framed harbor views.", cam: { px: -5, py: 6, pz: -9, tx: 0, ty: 4, tz: 0 } },
  { id: "street", title: "Street Level", description: "A composed street presence behind mature plantings.", cam: { px: 7, py: 1.4, pz: 7, tx: 0, ty: 1.8, tz: 0 } },
  { id: "aerial", title: "Aerial", description: "The full massing and site from above.", cam: { px: 14, py: 14, pz: 14, tx: 0, ty: 3, tz: 0 } },
  { id: "skyline", title: "Skyline Vantage", description: "The residence set against the wider city panorama.", cam: { px: 18, py: 7, pz: 16, tx: 0, ty: 4, tz: 0 } },
];

type CamState = { px: number; py: number; pz: number; tx: number; ty: number; tz: number };

function buildScene(dark: boolean): { scene: THREE.Scene; dispose: () => void } {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(dark ? 0x0b0b0b : 0xdfe6f2, dark ? 0.05 : 0.022);

  scene.add(new THREE.AmbientLight(dark ? 0x3a4a70 : 0xffffff, dark ? 0.7 : 1.0));
  const d = new THREE.DirectionalLight(0xffffff, dark ? 1.0 : 1.3);
  d.position.set(7, 13, 5);
  scene.add(d);
  const p = new THREE.PointLight(0x2f6bff, dark ? 0.9 : 0.5, 38);
  p.position.set(-7, 5, -5);
  scene.add(p);

  const grid = new THREE.GridHelper(80, 48, 0x2f6bff, dark ? 0x161616 : 0xc2cee0);
  const gridMat = grid.material as THREE.Material;
  gridMat.transparent = true;
  gridMat.opacity = dark ? 0.22 : 0.35;
  scene.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({ color: dark ? 0x202c44 : 0x6b7a96, roughness: 0.75, metalness: 0.2 });
  const bronzeMat = new THREE.MeshStandardMaterial({ color: 0x8a6b3f, roughness: 0.5, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: dark ? 0x2f6bff : 0x9fc0ff,
    emissive: 0x2f6bff,
    emissiveIntensity: dark ? 0.75 : 0.35,
    roughness: 0.25,
    metalness: 0.7,
  });
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [wallMat, glassMat, bronzeMat];

  const box = new THREE.BoxGeometry(1, 1, 1);
  const winGeo = new THREE.BoxGeometry(0.14, 0.28, 0.05);
  geos.push(box, winGeo);

  const towers = [
    { x: 0, z: 0, w: 3.4, d: 3, h: 8.5 },
    { x: 3.6, z: -1.1, w: 2.4, d: 2.2, h: 6 },
    { x: -3.3, z: 1, w: 2.1, d: 1.9, h: 5 },
  ];
  towers.forEach((t, ti) => {
    const m = new THREE.Mesh(box, ti === 1 ? bronzeMat : wallMat);
    m.scale.set(t.w, t.h, t.d);
    m.position.set(t.x, t.h / 2, t.z);
    scene.add(m);

    const cols = Math.max(2, Math.round(t.w));
    const rows = Math.max(4, Math.round(t.h));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r + c + ti) % 3 === 0) continue;
        const lit = (r * cols + c) % 2 === 0;
        const y = 0.5 + r * (t.h / rows);
        const xOff = (c - (cols - 1) / 2) * (t.w / cols);
        const w = new THREE.Mesh(winGeo, lit ? glassMat : wallMat);
        w.position.set(t.x + xOff, y, t.z + t.d / 2 + 0.04);
        scene.add(w);
        const w2 = new THREE.Mesh(winGeo, lit ? glassMat : wallMat);
        w2.position.set(t.x + xOff, y, t.z - t.d / 2 - 0.04);
        w2.rotation.y = Math.PI;
        scene.add(w2);
      }
    }
  });

  // Reflecting pool accent (subtle, contained)
  const poolGeo = new THREE.PlaneGeometry(6, 3);
  geos.push(poolGeo);
  const poolMat = new THREE.MeshStandardMaterial({ color: dark ? 0x123a66 : 0x9fc0ff, emissive: 0x2f6bff, emissiveIntensity: dark ? 0.2 : 0.05, roughness: 0.2, metalness: 0.8 });
  mats.push(poolMat);
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(-7, 0.02, 2);
  scene.add(pool);

  return {
    scene,
    dispose: () => {
      geos.forEach((g) => g.dispose());
      mats.forEach((mm) => mm.dispose());
      grid.geometry.dispose();
      gridMat.dispose();
    },
  };
}

export function BuildingTour() {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { theme } = useUI();
  const dark = useMemo(() => {
    if (theme === "system") {
      return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return theme === "dark";
  }, [theme]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(true);
  const stateRef = useRef<CamState>({ ...STOPS[0]!.cam });
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Three.js lifecycle (rebuilds when theme changes)
  useEffect(() => {
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      if (!gl) {
        setSupported(false);
        return;
      }
    } catch {
      setSupported(false);
      return;
    }
    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    const { scene, dispose } = buildScene(dark);
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    const s0 = STOPS[0]!.cam;
    camera.position.set(s0.px, s0.py, s0.pz);
    camera.lookAt(s0.tx, s0.ty, s0.tz);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);
    setReady(true);

    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e) visible = e.isIntersecting;
    }, { threshold: 0.05 });
    io.observe(mount);
    const clock = new THREE.Clock();
    const render = () => {
      raf = requestAnimationFrame(render);
      if (!visible) return;
      const t = clock.getElapsedTime();
      const s = stateRef.current;
      camera.position.set(s.px + Math.sin(t * 0.4) * 0.18, s.py, s.pz + Math.cos(t * 0.35) * 0.12);
      camera.lookAt(s.tx, s.ty + Math.sin(t * 0.3) * 0.08, s.tz);
      renderer.render(scene, camera);
    };
    render();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      gsap.killTweensOf(stateRef.current);
      dispose();
      renderer.dispose();
      if (renderer.domElement && mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      rendererRef.current = null;
    };
  }, [dark]);

  // Camera transition when index changes
  useEffect(() => {
    if (!ready) return;
    const target = STOPS[index]!.cam;
    if (reduced) {
      stateRef.current = { ...target };
      return;
    }
    gsap.killTweensOf(stateRef.current);
    gsap.to(stateRef.current, { ...target, duration: 1.15, ease: "power2.inOut" });
  }, [index, ready, reduced]);

  // Auto-advance every 5s when playing
  useEffect(() => {
    if (!playing || !ready) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % STOPS.length), 5000);
    return () => clearTimeout(t);
  }, [playing, ready, index]);

  const go = (dir: number) => setIndex((i) => (i + dir + STOPS.length) % STOPS.length);

  if (!supported) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-line bg-subtle text-sm text-muted">
        3D tour is unavailable in this browser.
      </div>
    );
  }

  const stop = STOPS[index]!;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border shadow-elevated",
        dark ? "border-line bg-[#0b0b0b]" : "border-line bg-gradient-to-b from-[#eef2fb] to-[#d3dcec]",
      )}
    >
      <div ref={mountRef} className="relative aspect-[16/10] w-full sm:aspect-[2/1]" />
      {!ready && <div className="absolute inset-0 animate-pulse bg-subtle" />}

      {/* Hotspot markers */}
      <Hotspot className="left-[26%] top-[40%]" tone={dark ? "light" : "dark"} />
      <Hotspot className="left-[62%] top-[28%]" tone={dark ? "light" : "dark"} />
      <Hotspot className="left-[48%] top-[60%]" tone={dark ? "light" : "dark"} />

      {/* Stop info */}
      <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-5 sm:p-7", dark ? "from-black/80" : "from-black/35")}>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Stop {index + 1} / {STOPS.length}</p>
        <h3 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{stop.title}</h3>
        <p className="mt-1 max-w-md text-sm text-white/85">{stop.description}</p>
      </div>

      {/* Prev / Next */}
      <button onClick={() => go(-1)} aria-label="Previous stop" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => go(1)} aria-label="Next stop" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Pause / Play */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <button onClick={() => setPlaying((p) => !p)} className="flex h-9 items-center gap-1.5 rounded-full bg-black/30 px-3 text-xs font-medium text-white backdrop-blur transition hover:bg-black/50">
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      {/* Dots */}
      <div className="absolute left-1/2 top-3 flex max-w-[60%] -translate-x-1/2 flex-wrap justify-center gap-1.5">
        {STOPS.map((s, i) => (
          <button key={s.id} onClick={() => setIndex(i)} aria-label={`Go to ${s.title}`} className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-6 bg-accent" : "w-1.5 bg-white/50 hover:bg-white/80")} />
        ))}
      </div>
      {/* keep renderer referenced to satisfy strict unused guard */}
      <span className="hidden">{String(Boolean(rendererRef.current))}</span>
    </div>
  );
}

function Hotspot({ className, tone }: { className?: string; tone: "light" | "dark" }): ReactNode {
  const dot = tone === "light" ? "bg-accent ring-white/40" : "bg-accent ring-white/50";
  return (
    <span className={cn("pointer-events-none absolute z-10 flex h-3 w-3", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
      <span className={cn("relative inline-flex h-3 w-3 rounded-full ring-2", dot)} />
    </span>
  );
}
