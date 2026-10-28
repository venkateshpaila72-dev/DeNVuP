"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";
import SectionHeading from "./SectionHeading";

const services = [
  {
    n: "01",
    title: "Web Development",
    text: "Fast, scalable websites and web apps built with modern frameworks.",
  },
  {
    n: "02",
    title: "UI/UX Design",
    text: "Clear, beautiful interfaces designed around how people actually use them.",
  },
  {
    n: "03",
    title: "Branding",
    text: "Logos, color systems and visual identities that make brands memorable.",
  },
  {
    n: "04",
    title: "AI Solutions",
    text: "Practical AI features and tools that save time and add real value.",
  },
];

export default function Services() {
  const root = useRef<HTMLElement>(null);

  // On phones / short screens every piece follows the scrollbar: the label first, then the heading,
  // then each service row, alternating from the left and the right. Nothing plays by itself:
  // scroll slowly and it moves slowly, stop and it stops, scroll up and it plays backwards.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Only for phones / short screens. On desktop the pinned About -> Services scene
      // (AboutToServices.tsx) builds this content itself, and two animations must never fight.
      mm.add("((max-width: 899px) or (max-height: 619px)) and (prefers-reduced-motion: no-preference)", () => {
        // each piece has its own trigger, so each one is tied to its own position on the screen
        const reveal = (target: Element | string, from: gsap.TweenVars, start: number, end: number) =>
          gsap.fromTo(target, from, {
            opacity: 1,
            x: 0,
            y: 0,
            ease: "power2.out",
            scrollTrigger: { trigger: target, start: `top ${start}%`, end: `top ${end}%`, scrub: 0.8 },
          });

        reveal(".sv-label", { opacity: 0, y: 24 }, 95, 80);
        reveal(".sv-title", { opacity: 0, y: 28 }, 92, 72);
        gsap.utils.toArray<HTMLElement>(".sv-row", root.current).forEach((row, i) => {
          const dir = i % 2 === 0 ? -1 : 1; // left, right, left, right...
          reveal(row, { opacity: 0, x: dir * 40 }, 94, 72);
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="services" ref={root} className="section sh-host">
      <SectionHeading label="SERVICES" tone="dark" />

      <div className="container">
        <p className="eyebrow sv-label">What we do</p>
        <h2 className="section-title sv-title">Services built to help brands grow.</h2>

        <div className="service-list">
          {services.map((s) => (
            <div key={s.n} className="sv-row">
              <article className="service">
                <span className="service-num">{s.n}</span>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-text">{s.text}</p>
                <ArrowUpRight className="service-arrow" size={28} aria-hidden="true" />
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}