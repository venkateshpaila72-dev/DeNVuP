"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";
import { team, slugOf } from "../lib/team";
import SectionHeading from "./SectionHeading";
import "./team.css";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function Team() {
  const root = useRef<HTMLElement>(null);
  const members = team.slice(0, 4);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // circles start spread out, then settle into their overlapping positions one after another
        gsap.from(".tp-circle", {
          x: (i: number) => (i - 1.5) * 48,
          scale: 0.7,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: ".tp-group", start: "top 85%", once: true },
        });
        gsap.from(".tp-arrow", {
          x: -12,
          opacity: 0,
          duration: 0.7,
          delay: 0.5,
          ease: "power3.out",
          scrollTrigger: { trigger: ".tp-group", start: "top 85%", once: true },
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="team" ref={root} className="section section-light sh-host">
      <SectionHeading label="TEAM" tone="light" />

      <div className="container tp">
        <div className="tp-text">
          <p className="eyebrow">Team Portfolios</p>
          <h2 className="section-title">Meet the people behind DENVUP.</h2>
          <p className="tp-intro">
            A small team that designs, builds and cares about every project. Get to know us and
            explore our individual portfolios.
          </p>
        </div>

        <div className="tp-group">
          <ul className="tp-circles" aria-label="DENVUP team members">
            {members.map((m) => (
              <li key={m.name} className="tp-circle">
                <Link
                  href={`/team#${slugOf(m.name)}`}
                  className="tp-link"
                  aria-label={`${m.name}, ${m.role}. View profile`}
                >
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photo} alt="" loading="lazy" />
                  ) : (
                    <span className="tp-initials" aria-hidden="true">
                      {initials(m.name)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/team" className="tp-arrow" aria-label="View all team portfolios">
            <ArrowRight size={22} />
          </Link>
        </div>
      </div>
    </section>
  );
}