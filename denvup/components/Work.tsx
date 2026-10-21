"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";
import { projects } from "../lib/projects";
import "./projects-gallery.css";

// ---- Tuning knobs ----
const WHEEL_RADIUS = 1.05; // size of the wheel as a multiple of the screen width (bigger = flatter arc, less tilt)
const GAP = 0.05; // space between cards along the wheel, as a fraction of the screen width
const SCROLL_PER_CARD = 0.8; // how much you scroll for the wheel to turn one card (in screen heights)
const RISE_SCROLL = 0.55; // scroll distance for the cards to rise into view (in screen heights)
const CENTER_Y = 0.5; // vertical position of the middle card (0 = top, 1 = bottom)

const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export default function Work() {
  const root = useRef<HTMLElement>(null);
  const head = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Pinned wheel animation: desktop only, and only if motion is allowed
      mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const section = root.current;
        const headEl = head.current;
        if (!section || !headEl) return;

        const cards = gsap.utils.toArray<HTMLElement>(".pg-card", section);
        if (!cards.length) return;
        const n = cards.length;

        section.classList.add("is-pinned");

        const m = {
          vw: 0, vh: 0, w: 0, h: 0,
          R: 0, step: 0, cx: 0, cy: 0,
          rise0: 0, S: 1, r: 0.2,
        };

        const measure = () => {
          m.vw = document.documentElement.clientWidth;
          m.vh = window.innerHeight;
          m.w = cards[0].offsetWidth;
          m.h = cards[0].offsetHeight;

          // the wheel: its centre is far BELOW the screen, so the cards form an arch on top
          m.R = m.vw * (m.vw < 1100 ? WHEEL_RADIUS * 1.25 : WHEEL_RADIUS);
          m.step = (m.w + m.vw * GAP) / m.R; // angle between two neighbouring cards (radians)
          m.cx = m.vw / 2;
          m.cy = m.vh * CENTER_Y + m.R;

          m.rise0 = m.vh * 0.22 + m.h / 2; // how far below the cards start (they peek from the bottom)

          const riseDist = m.vh * RISE_SCROLL;
          const travel = (n - 1) * m.vh * SCROLL_PER_CARD;
          m.S = riseDist + travel; // total scroll distance of the pinned section
          m.r = riseDist / m.S; // share of the scroll used by the rise phase
        };

        const render = (p: number) => {
          const rp = clamp(p / m.r); // rise phase 0 -> 1
          const tp = clamp((p - m.r * 0.5) / (1 - m.r * 0.5)); // wheel turning 0 -> 1
          const s = tp * (n - 1); // which card is in the middle (0 = first card)

          // heading drifts up and fades while the cards rise
          const hp = easeOut(rp);
          headEl.style.opacity = String(1 - hp);
          headEl.style.transform = `translate3d(0, ${-hp * 90}px, 0)`;

          const lift = (1 - easeOut(rp)) * m.rise0;

          cards.forEach((el, i) => {
            // angle of this card on the wheel: 0 = top centre, + = right, - = left
            const th = (i - s) * m.step;

            const x = m.cx + m.R * Math.sin(th) - m.w / 2;
            const y = m.cy - m.R * Math.cos(th) - m.h / 2 + lift;

            gsap.set(el, {
              x,
              y,
              rotation: (th * 180) / Math.PI, // tilts clockwise on the right, anti-clockwise on the left
              zIndex: 100 - Math.round(Math.abs(i - s) * 10), // middle card on top
            });
          });
        };

        const state = { p: 0 };
        measure();
        render(0);

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => {
              measure();
              return "+=" + m.S;
            },
            pin: true,
            scrub: 1, // light smoothing on top of Lenis
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => render(state.p),
          },
        });
        tl.to(state, { p: 1, ease: "none", duration: 1, onUpdate: () => render(state.p) });

        return () => {
          section.classList.remove("is-pinned");
          // only clear what the animation set (NOT the card colours, which React owns)
          gsap.set(cards, { clearProps: "transform,zIndex" });
          headEl.style.opacity = "";
          headEl.style.transform = "";
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="projects" ref={root} className="pg">
      <div ref={head} className="container pg-head">
        <p className="eyebrow">Projects</p>
        <h2 className="pg-title">Projects we&apos;re proud of.</h2>
      </div>

      <div className="pg-stage">
        {projects.map((p) => {
          const body = (
            <>
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt={`${p.title} preview`} className="pg-img" />
              )}
              <span className="pg-shade" />
              <span className="pg-type">{p.type}</span>
              {p.placeholder && <span className="pg-tag">Placeholder</span>}
              <h3 className="pg-caption">{p.title}</h3>
              {p.url && <ArrowUpRight className="pg-arrow" size={24} aria-hidden="true" />}
            </>
          );

          // "work-card" is kept so the glow cursor still recognises the cards
          return p.url ? (
            <a
              key={p.title}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pg-card work-card"
              style={{ background: p.bg }}
              aria-label={`${p.title} (opens in a new tab)`}
            >
              {body}
            </a>
          ) : (
            <article key={p.title} className="pg-card work-card" style={{ background: p.bg }}>
              {body}
            </article>
          );
        })}
      </div>
    </section>
  );
}