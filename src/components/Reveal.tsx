import { type ElementType, type ReactNode, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks";

/**
 * Reveal — animates children into view on scroll.
 * Honors prefers-reduced-motion (renders final state immediately).
 * Cleans up the GSAP context on unmount.
 */
export function Reveal({
  children,
  className,
  y = 28,
  stagger = 0,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  stagger?: number;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const targets = stagger ? el.children : el;
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay,
          ease: "power3.out",
          stagger,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        },
      );
    }, el as HTMLElement);
    return () => ctx.revert();
  }, [reduced, y, stagger, delay]);

  return (
    <Tag ref={ref as never} className={className} style={reduced ? undefined : { opacity: stagger ? 1 : 0 }}>
      {children}
    </Tag>
  );
}
