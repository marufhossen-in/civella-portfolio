import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks";

/**
 * Hero3D — subtle Three.js backdrop: a slowly drifting wireframe city grid
 * with floating property pins. Lazy-gated by WebGL availability, viewport
 * width and IntersectionObserver. Disposes all GPU resources on unmount.
 * Renders nothing if unsupported (parent shows the hero image instead).
 */
export function Hero3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (reduced) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      const test = document.createElement("canvas");
      const gl = test.getContext("webgl") || test.getContext("experimental-webgl");
      if (!gl) return;
      setCapable(true);
    } catch {
      return;
    }

    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0b0b, 0.05);

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 5, 14);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Ground grid
    const grid = new THREE.GridHelper(60, 40, 0x2f6bff, 0x1c1c1c);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.25;
    grid.position.y = -2;
    scene.add(grid);

    // Wireframe buildings
    const group = new THREE.Group();
    const buildingMat = new THREE.MeshBasicMaterial({ color: 0x2f6bff, wireframe: true, transparent: true, opacity: 0.5 });
    const buildings: THREE.Mesh[] = [];
    for (let i = 0; i < 26; i++) {
      const w = 0.6 + Math.random() * 1.2;
      const h = 1 + Math.random() * 5;
      const d = 0.6 + Math.random() * 1.2;
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, buildingMat);
      mesh.position.set((Math.random() - 0.5) * 26, h / 2 - 2, (Math.random() - 0.5) * 26);
      group.add(mesh);
      buildings.push(mesh);
    }
    scene.add(group);

    // Floating pins (property markers)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x4f86ff, transparent: true, opacity: 0.9 });
    const pins: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.SphereGeometry(0.16, 12, 12);
      const pin = new THREE.Mesh(geo, pinMat);
      pin.position.set((Math.random() - 0.5) * 18, Math.random() * 4 + 1, (Math.random() - 0.5) * 18);
      pins.push(pin);
      scene.add(pin);
    }

    // Particle field
    const pGeo = new THREE.BufferGeometry();
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 40;
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x4f86ff, size: 0.06, transparent: true, opacity: 0.5 }),
    );
    scene.add(points);

    // Pause when offscreen
    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) visible = entry.isIntersecting;
      },
      { threshold: 0.05 },
    );
    io.observe(mount);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.05;
      points.rotation.y = t * 0.02;
      pins.forEach((p, i) => {
        p.position.y += Math.sin(t * 1.2 + i) * 0.004;
      });
      camera.position.x = Math.sin(t * 0.15) * 2;
      camera.lookAt(0, 1, 0);
      renderer?.render(scene, camera);
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
      buildings.forEach((b) => b.geometry.dispose());
      pins.forEach((p) => p.geometry.dispose());
      pGeo.dispose();
      (points.material as THREE.Material).dispose();
      buildingMat.dispose();
      pinMat.dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      renderer?.dispose();
      if (renderer?.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [reduced]);

  if (!capable) return null;
  return <div ref={mountRef} className="absolute inset-0 h-full w-full" aria-hidden />;
}
