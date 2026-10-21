"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "../lib/gsap";
import "./section-heading.css";

type Props = {
  label: string; // e.g. "ABOUT"
  tone?: "dark" | "light"; // "dark" = for dark sections, "light" = for cream sections
  /**
   * Only for a section that is pinned (like Projects). Returns how many pixels the pinned part
   * scrolls for, so the heading keeps moving for the whole pinned animation.
   */
  pinLength?: () => number;
};

// ---- Tuning knobs ----
const FIRST = 0.04; // the first letter starts moving here (0 to 1 = the section's scroll range)
const LAST = 0.88; // the last letter has arrived at the right edge by here
const SPREAD = 0.9; // how far the letters scatter from each other mid-way (0 = all move together, 1.5 = very wide)
const MIN_SCALE = 0.5; // letters shrink to this size while travelling, then grow back (1 = no size change)
const EASE = "power2.inOut"; // movement style of each letter
const SMOOTHING = 0.6; // seconds of easing on top of the scroll (0 = tied exactly to the scrollbar)

const NO_MOTION_OK = "(prefers-reduced-motion: no-preference)";
const PINNED_MQ = "(min-width: 900px) and (prefers-reduced-motion: no-preference)";
const NORMAL_MQ = "(max-width: 899px) and (prefers-reduced-motion: no-preference)";

// One heading per section. The word starts together at the left edge, its letters peel away one
// by one and scatter while you scroll through the section, then gather again as the word reaches
// the right edge and fades out. It is decorative only: behind the content, never blocks clicks.
export default function SectionHeading({ label, tone = "dark", pinLength }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = text.current;
      const host = wrap.current?.parentElement; // the section this heading belongs to
      if (!el || !host) return;

      const vw = () => document.documentElement.clientWidth;
      // distance from the left resting place to the right resting place (same margin on both sides)
      const travel = () => {
        const pad = parseFloat(getComputedStyle(el).left) || 0;
        return Math.max(vw() - pad * 2 - el.offsetWidth, 0);
      };

      const mm = gsap.matchMedia();

      const build = (pinned: boolean) => {
        const dash = el.querySelector<HTMLElement>(".sh-dash");
        const letters = gsap.utils.toArray<HTMLElement>(".sh-letter", el);
        const count = letters.length;

        // each letter travels for `dur`; letter k starts `lag` after letter k-1
        const span = LAST - FIRST;
        const dur = span / (1 + SPREAD);
        const lag = count > 1 ? (span * SPREAD) / ((count - 1) * (1 + SPREAD)) : 0;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: host,
            // clamp() keeps the range inside the page, so the first and last section still finish
            start: "clamp(top 90%)",
            end:
              pinned && pinLength
                ? () => "+=" + Math.round(window.innerHeight * 0.9 + pinLength())
                : "clamp(bottom 30%)",
            scrub: SMOOTHING,
            invalidateOnRefresh: true,
          },
        });

        // the whole heading fades in at the start and out at the very end
        tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.12 }, 0);
        tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: 0.1, immediateRender: false }, 0.9);

        // the small ember dash travels with the first letter
        if (dash) {
          tl.fromTo(dash, { x: 0 }, { x: () => travel(), duration: dur, ease: EASE }, FIRST);
        }

        // every letter: its own move to the right, plus shrink then grow back
        letters.forEach((l, i) => {
          const at = FIRST + i * lag;
          tl.fromTo(l, { x: 0 }, { x: () => travel(), duration: dur, ease: EASE }, at);
          tl.fromTo(l, { scale: 1 }, { scale: MIN_SCALE, duration: dur / 2, ease: "sine.out" }, at);
          tl.fromTo(
            l,
            { scale: MIN_SCALE },
            { scale: 1, duration: dur / 2, ease: "sine.in", immediateRender: false },
            at + dur / 2
          );
        });
      };

      if (pinLength) {
        mm.add(PINNED_MQ, () => build(true));
        mm.add(NORMAL_MQ, () => build(false));
      } else {
        mm.add(NO_MOTION_OK, () => build(false));
      }

      // the heading's width changes when the web font arrives, so measure again then
      let alive = true;
      document.fonts?.ready.then(() => {
        if (alive) ScrollTrigger.refresh();
      });

      return () => {
        alive = false;
        mm.revert();
      };
    },
    { scope: wrap }
  );

  return (
    <div ref={wrap} className={`sh sh-${tone}`} aria-hidden="true">
      <span ref={text} className="sh-text">
        <i className="sh-dash" />
        {label.split("").map((ch, i) => (
          <span key={i} className="sh-letter">
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </div>
  );
}