"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import "./motion.css";

type Props = {
  words: string[]; // e.g. ["OUR", "SERVICES"]
  tone?: "dark" | "light"; // "dark" = for dark sections, "light" = for cream sections
};

// Big outlined label that enters from the left, drifts right while you scroll
// through the section, and leaves through the right edge.
export default function SectionWords({ words, tone = "dark" }: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = wrap.current;
      const host = el?.parentElement; // the section this label belongs to
      if (!el || !host) return;

      const items = gsap.utils.toArray<HTMLElement>(".sw-word", el);
      const mm = gsap.matchMedia();

      const build = (full: boolean) => {
        const vw = () => document.documentElement.clientWidth;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: host,
            start: "top 80%",
            end: "bottom 40%",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        items.forEach((w, i) => {
          const offLeft = () => -(w.offsetLeft + w.offsetWidth + 40);
          const offRight = () => vw() - w.offsetLeft + 40;
          const drift = () => vw() * (full ? 0.14 : 0.07) * (1 + i * 0.45); // each word drifts at its own rate

          tl.fromTo(w, { x: offLeft, opacity: 0 }, { x: 0, opacity: 1, ease: "power3.out", duration: 0.3 }, i * 0.06)
            .to(w, { x: drift, ease: "none", duration: 0.4 }, 0.35 + i * 0.04)
            .to(w, { x: offRight, ease: "power3.in", duration: 0.3 }, 0.75 + i * 0.04);
        });
      };

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => build(true));
      mm.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => build(false));

      return () => mm.revert();
    },
    { scope: wrap }
  );

  return (
    <div ref={wrap} className={`sw sw-${tone}`} aria-hidden="true">
      <div className="sw-row">
        {words.map((w, i) => (
          <span key={w + i} className="sw-word">
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}