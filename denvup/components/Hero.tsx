"use client";

import { useRef } from "react";
import { ArrowRight, Play } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";
import FoxParticles from "./FoxParticles";
import "./hero-bg.css";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

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

  return (
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

      <a href="#about" className="scroll-cue" aria-label="Scroll to About">
        <span className="scroll-line" />
        <span>Scroll down</span>
      </a>
    </section>
  );
}