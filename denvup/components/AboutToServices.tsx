"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import "./about-services.css";

// ---- Tuning knobs ----
const SCROLL_LENGTH = 2.8; // how long you scroll for the whole scene change, in screen heights. Bigger = slower
const EXIT_FROM = 0.1; // About starts to move away (0 to 1 over SCROLL_LENGTH)
const EXIT_TO = 0.55; // ...and is completely gone by here
const DARK_FROM = 0.15; // the background starts to turn from cream to black
const DARK_TO = 0.65; // ...and is completely black by here
const CONTENT_AT = 0.7; // from here on the Services content builds up by itself (no more scrolling needed)
const ROW_SLIDE = 56; // how far the service rows travel in from the side (px)

// Must be identical to the media query used for the pinned layout in about-services.css
const WIPE_MQ = "(min-width: 900px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)";

type Props = { about: ReactNode; services: ReactNode };

export default function AboutToServices({ about, services }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(WIPE_MQ, () => {
        const wrap = root.current;
        if (!wrap) return;
        const aboutEl = wrap.querySelector<HTMLElement>(".at-about");
        const marker = wrap.querySelector<HTMLElement>(".at-marker");
        const anchor = wrap.querySelector<HTMLElement>(".at-anchor");
        if (!aboutEl || !marker || !anchor) return;
        const rows = gsap.utils.toArray<HTMLElement>(".sv-row", wrap);

        // The Services section and the scroll anchor must not both be id="services".
        // On desktop the section sits inside a sticky layer, so the anchor takes the id and the
        // "Services" links land in the right place. On phones the section keeps the id itself.
        const servicesSection = wrap.querySelector<HTMLElement>("section#services");
        if (servicesSection) servicesSection.id = "services-section";
        anchor.id = "services";

        // The About section is pinned with its BOTTOM edge on the bottom of the screen, so the screen
        // stays still while everything changes. This works out how far up that is, and where the
        // "Services" link should land.
        const measure = () => {
          const vh = window.innerHeight;
          const H = aboutEl.offsetHeight;
          wrap.style.setProperty("--at-d", `${SCROLL_LENGTH * 100}vh`);
          aboutEl.style.setProperty("--at-top", `${Math.min(0, vh - H)}px`);
          marker.style.top = `${Math.max(0, H - vh)}px`;
          anchor.style.top = `${Math.max(0, H - vh) + 0.85 * SCROLL_LENGTH * vh}px`;
        };
        measure();

        // Phase B: the Services content builds itself, one piece after another (not tied to scrolling)
        // label (0.5s) -> heading (0.75s) -> short pause -> rows, each 0.5s, 0.17s apart
        const content = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
        content
          .fromTo(".sv-label", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, 0)
          .fromTo(".sv-title", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.75 }, 0.4);
        rows.forEach((row, i) => {
          // first row from the left, second from the right, third from the left...
          const dir = i % 2 === 0 ? -1 : 1;
          content.fromTo(row, { opacity: 0, x: dir * ROW_SLIDE }, { opacity: 1, x: 0, duration: 0.5 }, 1.35 + i * 0.17);
        });

        let contentOn = false;
        const sync = (p: number, instant = false) => {
          const should = p >= CONTENT_AT;
          if (should === contentOn && !instant) return;
          contentOn = should;
          wrap.classList.toggle("is-on", should);
          if (instant) content.progress(should ? 1 : 0);
          else if (should) content.timeScale(1).play();
          else content.timeScale(2).reverse();
        };

        // Phase A: scroll-driven. About slides left and fades while the background turns black.
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: marker,
            start: "top top", // the moment the bottom of About reaches the bottom of the screen
            end: () => `+=${SCROLL_LENGTH * window.innerHeight}`,
            scrub: 1.2, // a little glide, so it feels smooth and cinematic
            invalidateOnRefresh: true,
            onRefreshInit: measure,
            onRefresh: (self) => sync(self.progress, true),
          },
        });
        // About leaves in a coordinated way: images go to their own screen edges, the text block
        // drifts up, the process steps fade up and out. (The image tweens state their start values
        // explicitly and do not render early, because About.tsx animates the same images on entry.)
        const exit = EXIT_TO - EXIT_FROM;
        tl.fromTo(
          ".at-about .about-img-left",
          { x: 0, opacity: 1 },
          { x: "-55vw", opacity: 0, ease: "power2.in", duration: exit, immediateRender: false },
          EXIT_FROM
        )
          .fromTo(
            ".at-about .about-img-right",
            { x: 0, opacity: 1 },
            { x: "55vw", opacity: 0, ease: "power2.in", duration: exit, immediateRender: false },
            EXIT_FROM
          )
          .to(".at-about .about-center", { y: -70, opacity: 0, ease: "power1.inOut", duration: exit * 0.85 }, EXIT_FROM + 0.02)
          .to(".at-about .about-steps", { y: -50, opacity: 0, ease: "power1.inOut", duration: exit * 0.8 }, EXIT_FROM);
        tl.to(".at-about .sh", { opacity: 0, duration: 0.2 }, EXIT_FROM);
        tl.fromTo(".at-dark", { opacity: 0 }, { opacity: 1, duration: DARK_TO - DARK_FROM }, DARK_FROM);
        // pad the timeline to exactly 1
        tl.to({}, { duration: 1 - DARK_TO }, DARK_TO);
        // Phase B starts from the smoothed progress, so the content never starts before the black has landed
        tl.eventCallback("onUpdate", () => sync(tl.progress()));
        sync(0, true);

        // About's height can change (fonts, images): measure again and refresh the scroll positions
        let timer = 0;
        let first = true;
        const ro = new ResizeObserver(() => {
          if (first) {
            first = false;
            return;
          }
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            measure();
            ScrollTrigger.refresh();
          }, 150);
        });
        ro.observe(aboutEl);

        return () => {
          window.clearTimeout(timer);
          ro.disconnect();
          content.kill();
          anchor.removeAttribute("id");
          if (servicesSection) servicesSection.id = "services";
          wrap.classList.remove("is-on");
          wrap.style.removeProperty("--at-d");
          aboutEl.style.removeProperty("--at-top");
          marker.style.top = "";
          anchor.style.top = "";
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="at">
      {/* the point where the scene change starts, and the point the "Services" link goes to */}
      <span className="at-marker" aria-hidden="true" />
      <span className="at-anchor" aria-hidden="true" />

      {/* About: stays on screen (pinned) while it slides away and the background turns black.
          The wrapper gives the pinned layer room to stay pinned (see about-services.css). */}
      <div className="at-about-wrap">
        <div className="at-about">{about}</div>
      </div>

      {/* The Services scene. It lies over About's last screen and holds the Services content. */}
      <div className="at-over">
        <div className="at-dark" aria-hidden="true" />
        <div className="at-services">{services}</div>
      </div>
    </div>
  );
}