import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks";

/**
 * BuildingHero — premium Three.js exterior: a cluster of architectural towers
 * with emissive windows, slow orbiting camera and a soft grid ground.
 * Gated by WebGL availability + viewport width + reduced-motion.
 * Returns null when unavailable (parent shows the static photo).
 * Disposes every GPU resource on unmount.
 */
export function BuildingHero({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined" || window.innerWidth < 768) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      if (!gl) return;
      setCapable(true);
    } catch {
      return;
    }

    const mount = mountRef.current;
    if (!mount) return;
    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070707, 0.05);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(9, 6, 9);
    camera.lookAt(0, 3, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0x4060a0, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(6, 12, 4);
    scene.add(dir);
    const rim = new THREE.PointLight(0x2f6bff, 1.2, 40);
    rim.position.set(-6, 4, -4);
    scene.add(rim);

    // Ground grid
    const grid = new THREE.GridHelper(60, 40, 0x2f6bff, 0x161616);
    const gridMat = grid.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.2;
    grid.position.y = -0.01;
    scene.add(grid);

    const group = new THREE.Group();
    const toDispose: THREE.BufferGeometry[] = [];
    const mats: THREE.Material[] = [];

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1b2740, roughness: 0.7, metalness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x2f6bff, emissive: 0x2f6bff, emissiveIntensity: 0.8, roughness: 0.3, metalness: 0.6 });
    mats.push(wallMat, glassMat);

    // Towers
    const towers: { x: number; z: number; w: number; d: number; h: number }[] = [
      { x: 0, z: 0, w: 3.2, d: 3.2, h: 9 },
      { x: 3.6, z: -1.2, w: 2.4, d: 2.4, h: 6.5 },
      { x: -3.4, z: 1.2, w: 2.2, d: 2.2, h: 5 },
    ];
    towers.forEach((t) => {
      const geo = new THREE.BoxGeometry(t.w, t.h, t.d);
      toDispose.push(geo);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(t.x, t.h / 2, t.z);
      group.add(mesh);

      // Window grid on each side
      const cols = Math.max(2, Math.round(t.w));
      const rows = Math.max(3, Math.round(t.h * 0.9));
      const wGeo = new THREE.BoxGeometry(0.18, 0.32, 0.06);
      toDispose.push(wGeo);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((r + c) % 3 === 0) continue; // sparse, varied windows
          const lit = Math.random() > 0.45;
          const mat = lit ? glassMat : wallMat;
          const y = 0.6 + r * (t.h / rows);
          const xOff = (c - (cols - 1) / 2) * (t.w / cols);
          for (const face of [0, 1]) {
            const w = new THREE.Mesh(wGeo, mat);
            const zSign = face === 0 ? 1 : -1;
            w.position.set(t.x + xOff, y, t.z + zSign * (t.d / 2 + 0.02));
            w.rotation.y = face === 0 ? 0 : Math.PI;
            group.add(w);
          }
          for (const face of [0, 1]) {
            const w = new THREE.Mesh(wGeo, mat);
            const xSign = face === 0 ? 1 : -1;
            w.position.set(t.x + xSign * (t.w / 2 + 0.02), y, t.z + xOff * (t.d / t.w));
            w.rotation.y = Math.PI / 2;
            group.add(w);
          }
        }
      }
    });
    scene.add(group);

    // Floating accent pins
    const pinGeo = new THREE.SphereGeometry(0.14, 12, 12);
    toDispose.push(pinGeo);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0x4f86ff, emissive: 0x4f86ff, emissiveIntensity: 1 });
    mats.push(pinMat);
    const pins: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(pinGeo, pinMat);
      p.position.set((Math.random() - 0.5) * 10, 2 + Math.random() * 6, (Math.random() - 0.5) * 8);
      pins.push(p);
      scene.add(p);
    }

    let visible = true;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (e) visible = e.isIntersecting;
    }, { threshold: 0.05 });
    io.observe(mount);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || !renderer) return;
      const t = clock.getElapsedTime();
      const radius = 11;
      camera.position.x = Math.cos(t * 0.12) * radius;
      camera.position.z = Math.sin(t * 0.12) * radius;
      camera.position.y = 6 + Math.sin(t * 0.2) * 0.6;
      camera.lookAt(0, 3.2, 0);
      pins.forEach((p, i) => (p.position.y += Math.sin(t * 1.3 + i) * 0.004));
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount || !renderer) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
      toDispose.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      gridMat.dispose();
      grid.geometry.dispose();
      renderer?.dispose();
      if (renderer?.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [reduced]);

  if (!capable) return null;
  return <div ref={mountRef} className={className} aria-hidden />;
}
