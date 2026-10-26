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

  // The content comes out of the dark one piece at a time as you scroll:
  // the small label first, then the heading, then the service rows in their order.
  // Each piece is tied to the scrollbar, so everything plays backwards when you scroll up.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const reveal = (target: Element | string, start: number, end: number) =>
          gsap.fromTo(
            target,
            { opacity: 0, y: 36 },
            {
              opacity: 1,
              y: 0,
              ease: "power2.out",
              scrollTrigger: { trigger: target, start: `top ${start}%`, end: `top ${end}%`, scrub: 0.8 },
            }
          );

        reveal(".sv-label", 96, 82);
        reveal(".sv-title", 94, 76);
        gsap.utils.toArray<HTMLElement>(".sv-row", root.current).forEach((row, i) => {
          reveal(row, 96 - i, 76 - i); // each row has its own position, so they appear one by one
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