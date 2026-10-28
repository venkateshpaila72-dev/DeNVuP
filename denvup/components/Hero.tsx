"use client";

import { Fragment, useRef } from "react";
import { ArrowDown, ArrowRight, Play } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";
import { getLenis } from "../lib/lenis";
import { createStepper } from "../lib/stepper";
import FoxParticles from "./FoxParticles";
import "./hero-bg.css";

/* =====================================================================
   Hero -> About: a cream circle takes over the screen and tells the DENVUP story.

   It works in 3 STEPS, and ONE scroll gesture (a wheel flick, a swipe or a key press) moves exactly one step,
   however fast you scroll:
     scroll 1 -> the circle grows and the first quotation appears
     scroll 2 -> the second quotation        scroll 3 -> the third quotation
     scroll 4 -> the page continues into About
   Scrolling back one gesture fades the current quotation away and shows the previous state again.
   The visuals are one scrubbed timeline tied to the scroll position, so they are always in the right state,
   even if you use the scrollbar, a keyboard or a link.
   ===================================================================== */

const STEPS = 3; // number of scroll steps (one per quotation)
const STEP_MS = 1150; // how long one step takes to play. Bigger = slower, calmer

// The timeline is written in "step units": 0 -> 1 is scroll 1, 1 -> 2 is scroll 2, 2 -> 3 is scroll 3.
// At every whole number the screen is completely settled and readable.
const CIRCLE_RISE = 0.6; // the circle's centre travels from the bottom edge to the middle of the screen
const CIRCLE_GROW = 0.75; // the circle grows until it covers the whole hero
// When each quotation appears and leaves: [label starts, words start, leaves (or null = stays)]
const SCHEDULE: [number, number, number | null][] = [
  [0.4, 0.46, 1.0], // OUR MINDSET   (appears while the circle is still growing, leaves at the start of scroll 2)
  [1.35, 1.4, 2.0], // OUR PURPOSE
  [2.35, 2.4, null], // OUR PROMISE   (stays: it scrolls away together with the hero)
];
const LEAVE_DUR = 0.2; // how long a quotation takes to fade away
const WORD_DUR = 0.25; // how long one word takes to rise
const WORD_STAGGER = 0.04; // gap between words

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Word = { t: string; hl?: boolean }; // hl = highlighted in orange
const MANIFESTO: { label: string; words: Word[] }[] = [
  {
    label: "OUR MINDSET",
    words: [{ t: "WE" }, { t: "TURN" }, { t: "CURIOSITY" }, { t: "INTO" }, { t: "CREATION.", hl: true }],
  },
  {
    label: "OUR PURPOSE",
    words: [{ t: "WE" }, { t: "TURN" }, { t: "IDEAS" }, { t: "INTO" }, { t: "EXPERIENCES.", hl: true }],
  },
  {
    label: "OUR PROMISE",
    words: [
      { t: "WE" },
      { t: "BUILD" },
      { t: "WHAT" },
      { t: "MOVES" },
      { t: "BRANDS", hl: true },
      { t: "FORWARD.", hl: true },
    ],
  },
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const nextStep = useRef<(() => void) | null>(null); // set while the step controller is running

  // Intro animation
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.2 });
      tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.7 })
        .from(".hero-letter", { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.06 }, "-=0.4")
        .from(".hero-copy", { y: 24, opacity: 0, duration: 0.8 }, "-=0.5")
        .from(
          ".hero-cta > *",
          { y: 20, opacity: 0, duration: 0.6, stagger: 0.12, clearProps: "transform,opacity" },
          "-=0.5"
        )
        .from(".scroll-arrow", { opacity: 0, y: 12, duration: 0.8, clearProps: "transform" }, "-=0.2");

      gsap.from(".fox-wrap", { scale: 0.94, opacity: 0, duration: 1.4, ease: "power2.out" });
    },
    { scope: root }
  );

  // Hero -> About transition. The hero stays pinned while a plain cream circle grows from the bottom
  // centre. The three manifesto statements live INSIDE the circle, so they are revealed by it.
  useGSAP(
    () => {
      const el = root.current;
      const wipe = el?.querySelector<HTMLElement>(".hero-wipe");
      if (!el || !wipe) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // r: how far the circle has grown (0 = nothing visible, 1 = covers the whole hero)
        // c: how far its centre has risen (0 = just below the bottom edge, 1 = middle of the screen)
        const shape = { r: 0, c: 0 };

        const apply = () => {
          const vw = document.documentElement.clientWidth;
          const vh = window.innerHeight;
          const heroH = Math.max(vh, wipe.offsetHeight); // the hero can be taller than the screen on phones
          const cx = vw / 2;
          const cy0 = vh + 6; // start: centre just below the bottom edge, so nothing shows at all
          const cy = cy0 + (vh / 2 - cy0) * shape.c; // end: centre of the screen
          // radius that reaches the farthest corner of the hero from the current centre
          const full = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, heroH - cy)) + 24;
          wipe.style.clipPath = `circle(${full * shape.r}px at 50% ${cy}px)`;
        };
        apply();

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${STEPS * window.innerHeight}`, // one screen of scrolling per step
            pin: true,
            anticipatePin: 1,
            scrub: 0.4,
            invalidateOnRefresh: true,
            onRefresh: apply,
          },
        });

        // 1) the circle: its centre rises while it grows, until it covers everything.
        //    The arrow disappears with the first scroll; the hero text drifts up a little.
        tl.to(shape, { c: 1, ease: "power2.inOut", duration: CIRCLE_RISE, onUpdate: apply }, 0)
          .to(shape, { r: 1, ease: "power1.inOut", duration: CIRCLE_GROW, onUpdate: apply }, 0)
          .to(".scroll-arrow", { opacity: 0, duration: 0.15 }, 0)
          .to(".hero-text", { y: -40, duration: 0.8 }, 0)
          // the fox watermark settles in behind the first quotation
          .fromTo(".mf-fox-wrap", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, ease: "power1.out", duration: 0.8 }, 0.3);

        // 2) the three statements: label first, then the words rise out of a mask one after another.
        //    Each one leaves before the next arrives (the last one stays).
        gsap.utils.toArray<HTMLElement>(".mf-item", el).forEach((item, i) => {
          const [labelAt, wordsAt, leaveAt] = SCHEDULE[i];
          tl.fromTo(
            item.querySelector(".mf-label"),
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
            labelAt
          ).fromTo(
            item.querySelectorAll(".mf-word-in"),
            { yPercent: 115 },
            { yPercent: 0, duration: WORD_DUR, ease: "power3.out", stagger: WORD_STAGGER },
            wordsAt
          );
          if (leaveAt !== null) {
            tl.to(item, { opacity: 0, y: -28, duration: LEAVE_DUR, ease: "power1.in" }, leaveAt);
          }
        });

        // an empty tween stretches the timeline to exactly STEPS units
        tl.to({}, { duration: STEPS }, 0);

        // ---- one scroll gesture = one step ----
        const st = tl.scrollTrigger;
        if (!st) return;
        const stepper = createStepper({
          steps: STEPS,
          getY: () => window.scrollY - st.start,
          getUnit: () => (st.end - st.start) / STEPS,
          stepMs: STEP_MS,
        });

        // move the page to a position inside the pinned hero (with the smooth-scroll library when it exists)
        const goTo = (local: number, immediate = false) => {
          const y = st.start + local;
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(y, { duration: STEP_MS / 1000, easing: easeInOutCubic, immediate });
          else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
        };
        const run = (d: { consume: boolean; target?: number }, e?: Event) => {
          if (d.consume && e) {
            e.preventDefault();
            e.stopPropagation(); // the smooth-scroll library must not scroll the page on its own as well
          }
          if (d.target !== undefined) goTo(d.target);
        };

        // mouse wheel / trackpad
        const onWheel = (e: WheelEvent) => {
          if (e.ctrlKey || e.deltaY === 0) return; // pinch-zoom and sideways scrolling are left alone
          run(stepper.onGesture(e.deltaY > 0 ? 1 : -1, performance.now()), e);
        };

        // keyboard
        const onKey = (e: KeyboardEvent) => {
          if (e.altKey || e.ctrlKey || e.metaKey) return;
          const t = e.target as HTMLElement | null;
          if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
          if (e.key === " " && t && /^(A|BUTTON)$/.test(t.tagName)) return; // Space presses a focused link / button
          let dir: 1 | -1 | 0 = 0;
          if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) dir = 1;
          else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) dir = -1;
          if (dir) run(stepper.onGesture(dir, performance.now()), e);
        };

        // touch: a swipe moves one step
        let touchY = 0;
        const onTouchStart = (e: TouchEvent) => {
          touchY = e.touches[0].clientY;
        };
        const onTouchMove = (e: TouchEvent) => {
          const dy = touchY - e.touches[0].clientY;
          if (Math.abs(dy) > 6 && stepper.intercepts(dy > 0 ? 1 : -1, performance.now())) e.preventDefault();
        };
        const onTouchEnd = (e: TouchEvent) => {
          const dy = touchY - e.changedTouches[0].clientY;
          if (Math.abs(dy) > 40) run(stepper.onGesture(dy > 0 ? 1 : -1, performance.now(), { fresh: true }));
        };

        // scrolling up out of About by wheel / keys: stop exactly on the last step, so it is seen first
        let prevY = window.scrollY;
        const onScroll = () => {
          const y = window.scrollY - st.start;
          const snap = stepper.onPosition(prevY, y, performance.now());
          prevY = y;
          if (snap !== null) goTo(snap, true);
        };
        prevY = window.scrollY - st.start;

        window.addEventListener("wheel", onWheel, { passive: false, capture: true });
        window.addEventListener("keydown", onKey, { capture: true });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd, { passive: true });
        window.addEventListener("scroll", onScroll, { passive: true });
        nextStep.current = () => run(stepper.onGesture(1, performance.now(), { fresh: true }));

        return () => {
          window.removeEventListener("wheel", onWheel, { capture: true });
          window.removeEventListener("keydown", onKey, { capture: true });
          window.removeEventListener("touchstart", onTouchStart);
          window.removeEventListener("touchmove", onTouchMove);
          window.removeEventListener("touchend", onTouchEnd);
          window.removeEventListener("scroll", onScroll);
          nextStep.current = null;
          wipe.style.clipPath = "";
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  // The arrow does the same as one scroll down: it starts the first step
  const scrollDown = () => nextStep.current?.();

  return (
    // The pinned hero gets wrapped in an extra element by GSAP (the "pin spacer").
    // This outer div belongs to React, so that wrapping happens inside it and React's
    // own list of page sections is never disturbed.
    <div className="hero-pin">
      <section id="home" ref={root} className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <p className="eyebrow hero-eyebrow">Creative Digital Agency</p>

            <h1 className="hero-title" aria-label="DENVUP">
              <span className="hero-mask" aria-hidden="true">
                {"DENVUP".split("").map((ch, i) => (
                  <span key={i} className="hero-letter">
                    {ch}
                  </span>
                ))}
              </span>
            </h1>

            <p className="hero-copy">
              We design and develop digital experiences that help brands stand out, connect with
              people, and grow.
            </p>

            <div className="hero-cta">
              <a href="#projects" className="btn btn-primary">
                Explore Our Work <ArrowRight size={16} />
              </a>
              {/* No showreel video yet: this still goes to Projects. Change href when you have one. */}
              <a href="#projects" className="btn btn-ghost">
                <span className="play-circle">
                  <Play size={12} fill="currentColor" />
                </span>
                Watch Showreel
              </a>
            </div>
          </div>

          <FoxParticles />
        </div>

        {/* The cream circle. Nothing of it is visible until you scroll. It holds the manifesto. */}
        <div className="hero-wipe">
          <div className="mf-fox-wrap" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/denvup-logo.png" alt="" className="mf-fox" />
          </div>

          <div className="mf">
            {MANIFESTO.map((item) => (
              <div key={item.label} className="mf-item">
                <p className="mf-label">{item.label}</p>
                <p className="mf-text">
                  {item.words.map((w, i) => (
                    <Fragment key={i}>
                      <span className="mf-word">
                        <span className={w.hl ? "mf-word-in mf-hl" : "mf-word-in"}>{w.t}</span>
                      </span>{" "}
                    </Fragment>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button type="button" className="scroll-arrow" onClick={scrollDown} aria-label="Scroll down">
          <span className="scroll-arrow-icon">
            <ArrowDown size={18} strokeWidth={1.5} />
          </span>
        </button>
      </section>
    </div>
  );
}