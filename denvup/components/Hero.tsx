"use client";

import { useRef } from "react";
import { ArrowRight, Play } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";
import FoxParticles from "./FoxParticles";
import WipeParticles from "./WipeParticles";
import "./hero-bg.css";

// How long the hero stays pinned while the cream takes over, as a multiple of the screen height.
// Smaller = shorter transition. 1 = one extra screen of scrolling.
const PIN_DESKTOP = 1.15;
const PIN_MOBILE = 0.9;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const level = useRef({ v: 0 }); // how visible the ember dust is (read by WipeParticles)

  // Intro animation (unchanged)
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.2 });
      tl.from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.7 })
        .from(".hero-letter", { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.06 }, "-=0.4")
        .from(".hero-copy", { y: 24, opacity: 0, duration: 0.8 }, "-=0.5")
        .from(".hero-cta > *", { y: 20, opacity: 0, duration: 0.6, stagger: 0.12 }, "-=0.5")
        .from(".scroll-cue", { opacity: 0, duration: 0.8 }, "-=0.2");

      gsap.from(".fox-wrap", { scale: 0.94, opacity: 0, duration: 1.4, ease: "power2.out" });
    },
    { scope: root }
  );

  // Hero -> About transition (scroll-driven; scrolling back up plays it in reverse).
  // The hero stays pinned while a cream dome rises from the bottom, covers it, shows a short
  // logo moment with ember dust, then lets go so the About section scrolls in.
  useGSAP(
    () => {
      const el = root.current;
      const wipe = el?.querySelector<HTMLElement>(".hero-wipe");
      const glow = el?.querySelector<HTMLElement>(".hero-wipe-glow");
      if (!el || !wipe || !glow) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const shape = { ry: 0 }; // dome height as a fraction of the screen height (0 to 1.25)
        const dust = level.current;
        dust.v = 0;

        // The dome is a very wide ellipse whose centre sits on the bottom edge of the screen
        const apply = () => {
          const vw = document.documentElement.clientWidth;
          const vh = window.innerHeight;
          const rx = vw * 1.4;
          const ry = shape.ry * vh;
          wipe.style.clipPath = `ellipse(${rx}px ${ry}px at 50% ${vh}px)`;
          // the orange rim is only a few pixels thick (change the 5 to make it thicker or thinner)
          glow.style.clipPath = `ellipse(${rx * 1.004}px ${ry + 5 * Math.min(1, shape.ry * 6)}px at 50% ${vh}px)`;
        };
        apply();

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * (window.innerWidth < 768 ? PIN_MOBILE : PIN_DESKTOP))}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onRefresh: apply,
          },
        });

        // 1) the dome rises and covers the hero (0 to 0.62)
        tl.to(shape, { ry: 1.25, ease: "power1.inOut", duration: 0.62, onUpdate: apply }, 0)
          .to(".hero-text", { y: -40, duration: 0.6 }, 0)
          .to(glow, { opacity: 0, duration: 0.2 }, 0.5)

          // 2) clean cream: corner marks appear, the ring draws, the logo pops in,
          //    the text ring and dashed ring turn while the dust drifts (0.5 to 0.88)
          .fromTo(
            ".wipe-deco",
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.12, stagger: 0.01 },
            0.56
          )
          .fromTo(".wipe-ring", { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "power2.inOut", duration: 0.2 }, 0.55)
          .fromTo(
            ".wipe-logo",
            { scale: 0.4, rotation: -20, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, ease: "back.out(1.5)", duration: 0.2 },
            0.6
          )
          .fromTo(".wipe-orbit", { rotation: -40 }, { rotation: 140, duration: 0.5 }, 0.5)
          .fromTo(".wipe-orbit-dash", { rotation: 0 }, { rotation: -120, duration: 0.5 }, 0.5)
          .to(dust, { v: 1, duration: 0.3 }, 0.45)

          // 3) everything fades away so the About content can take over (0.88 to 1)
          .to(".wipe-core", { scale: 1.6, opacity: 0, ease: "power2.in", duration: 0.12 }, 0.88)
          .to(".wipe-deco", { opacity: 0, duration: 0.1 }, 0.88)
          .to(dust, { v: 0, duration: 0.12 }, 0.88);

        return () => {
          wipe.style.clipPath = "";
          glow.style.clipPath = "";
          dust.v = 0;
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

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

        {/* Hero -> About transition layers (decorative, invisible until you scroll) */}
        <div className="hero-wipe-glow" aria-hidden="true" />
        <div className="hero-wipe" aria-hidden="true">
          <WipeParticles level={level} />

          {/* Design details around the centre (they only show during the cream moment) */}
          <div className="wipe-frame">
            <span className="wipe-corner wipe-corner-tl wipe-deco" />
            <span className="wipe-corner wipe-corner-tr wipe-deco" />
            <span className="wipe-corner wipe-corner-bl wipe-deco" />
            <span className="wipe-corner wipe-corner-br wipe-deco" />
            <span className="wipe-plus wipe-plus-1 wipe-deco">+</span>
            <span className="wipe-plus wipe-plus-2 wipe-deco">+</span>
            <span className="wipe-plus wipe-plus-3 wipe-deco">+</span>
            <span className="wipe-plus wipe-plus-4 wipe-deco">+</span>
            <span className="wipe-label wipe-label-tl wipe-deco">Web · UI/UX · Branding · AI</span>
            <span className="wipe-label wipe-label-tr wipe-deco">Creative Digital Agency</span>
            <span className="wipe-label wipe-label-bl wipe-deco">©2026 DENVUP</span>
            <span className="wipe-label wipe-label-br wipe-deco">Scroll to continue</span>
          </div>

          <div className="wipe-core">
            <svg className="wipe-orbit-dash" viewBox="0 0 260 260" fill="none">
              <circle cx="130" cy="130" r="124" />
            </svg>
            <svg className="wipe-orbit" viewBox="0 0 260 260">
              <defs>
                <path id="wipe-text-path" d="M130 130m-98 0a98 98 0 1 1 196 0a98 98 0 1 1 -196 0" />
              </defs>
              <text>
                <textPath href="#wipe-text-path" textLength="605" lengthAdjust="spacing">
                  DENVUP • CREATIVE DIGITAL AGENCY • DENVUP • CREATIVE DIGITAL AGENCY •
                </textPath>
              </text>
            </svg>
            <svg className="wipe-ring-svg" viewBox="0 0 260 260" fill="none">
              <circle className="wipe-ring" cx="130" cy="130" r="68" pathLength="1" />
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/denvup-logo.png" alt="" className="wipe-logo" />
          </div>
        </div>

        <a href="#about" className="scroll-cue" aria-label="Scroll to About">
          <span className="scroll-line" />
          <span>Scroll down</span>
        </a>
      </section>
    </div>
  );
}