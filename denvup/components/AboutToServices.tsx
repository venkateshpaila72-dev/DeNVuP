"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../lib/gsap";
import "./about-services.css";

/* =====================================================================
   The pinned scene: "How we work" -> About leaves -> background turns black -> Services builds up.
   The whole thing is ONE timeline tied to the scrollbar (scrub). Nothing plays by itself:
   scroll slowly and it moves slowly, stop and it stops, scroll up and it plays backwards.

   All the numbers below are in SCREEN HEIGHTS of scrolling while the scene is pinned.
   For example "1.5" means: it happens after you scrolled one and a half screens into the scene.
   ===================================================================== */

// 1) "How we work" builds up, then stays fully visible so it can be read
const PROCESS_AT = 0.05; // the small label starts
const STEPS_AT = 0.5; // the first of the five steps starts
const STEP_GAP = 0.3; // scrolling between one step and the next
const STEP_DUR = 0.45; // how long one step takes to fade in
const READ_FOR = 0.65; // everything stays still and readable for this long once the last step is in

// 2) About moves away and the background turns black
const EXIT_DUR = 0.8; // how long About takes to leave
const DARK_LAG = 0.2; // the black starts a little after About starts to leave
const DARK_DUR = 0.9; // how long the cream takes to become fully black

// 3) Services builds up on the black, one piece after another, always by scrolling
const SV_PAUSE = 0.05; // a short beat of plain black before the label
const SV_LABEL_DUR = 0.3;
const SV_TITLE_LAG = 0.15; // the heading starts a little after the label
const SV_TITLE_DUR = 0.4;
const SV_ROWS_LAG = 0.35; // the first row starts after the heading
const SV_ROW_GAP = 0.35; // scrolling between one row and the next
const SV_ROW_DUR = 0.45;
const SV_ROW_SLIDE = 64; // how far a row travels in from the side (px)
const END_HOLD = 0.35; // everything stays complete for this long before the page is released

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

        // ---- when does each phase happen (screen heights into the scene) ----
        const stepsEnd = STEPS_AT + (gsap.utils.toArray(".about-steps .step", wrap).length - 1) * STEP_GAP + STEP_DUR;
        const EXIT_AT = stepsEnd + READ_FOR;
        const DARK_AT = EXIT_AT + DARK_LAG;
        const SV_LABEL_AT = DARK_AT + DARK_DUR + SV_PAUSE;
        const SV_TITLE_AT = SV_LABEL_AT + SV_TITLE_LAG;
        const SV_ROWS_AT = SV_TITLE_AT + SV_ROWS_LAG;
        const rowsEnd = SV_ROWS_AT + Math.max(0, rows.length - 1) * SV_ROW_GAP + SV_ROW_DUR;
        // total scroll length of the scene: it follows the real number of services
        const LENGTH = rowsEnd + END_HOLD;
        // where the "Services" link lands: black is complete and the heading is in
        const LINK_AT = SV_TITLE_AT + SV_TITLE_DUR;

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
          wrap.style.setProperty("--at-d", `${LENGTH * 100}vh`);
          aboutEl.style.setProperty("--at-top", `${Math.min(0, vh - H)}px`);
          marker.style.top = `${Math.max(0, H - vh)}px`;
          anchor.style.top = `${Math.max(0, H - vh) + LINK_AT * vh}px`;
        };
        measure();

        // The Services layer only takes mouse clicks once its content has started to appear
        const sync = (time: number) => wrap.classList.toggle("is-on", time >= SV_LABEL_AT);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: marker,
            start: "top top", // the moment the bottom of About reaches the bottom of the screen
            end: () => `+=${LENGTH * window.innerHeight}`,
            scrub: 0.8, // a short glide so it feels smooth, but it always follows the scrollbar
            invalidateOnRefresh: true,
            onRefreshInit: measure,
            onRefresh: (self) => sync(self.progress * LENGTH),
          },
        });

        // 1) How we work: label, heading, then the steps one after another. They all STAY visible.
        tl.fromTo(
          ".about-steps-eyebrow",
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
          PROCESS_AT
        )
          .fromTo(
            ".about-steps-title",
            { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
            PROCESS_AT + 0.1
          )
          .fromTo(
            ".about-steps .step",
            { opacity: 0, y: 34, borderTopColor: "rgba(17,17,17,0)" },
            {
              opacity: 1,
              y: 0,
              borderTopColor: "rgba(17,17,17,1)",
              duration: STEP_DUR,
              ease: "power2.out",
              stagger: STEP_GAP,
            },
            STEPS_AT
          );

        // 2) About leaves in a coordinated way: images go to their own screen edges, the text block
        // drifts up, the process steps fade up and out. (The image tweens state their start values
        // explicitly and do not render early, because About.tsx animates the same images on entry.)
        tl.fromTo(
          ".at-about .about-img-left",
          { x: 0, opacity: 1 },
          { x: "-55vw", opacity: 0, ease: "power2.in", duration: EXIT_DUR, immediateRender: false },
          EXIT_AT
        )
          .fromTo(
            ".at-about .about-img-right",
            { x: 0, opacity: 1 },
            { x: "55vw", opacity: 0, ease: "power2.in", duration: EXIT_DUR, immediateRender: false },
            EXIT_AT
          )
          .to(
            ".at-about .about-block",
            { y: -70, opacity: 0, ease: "power1.inOut", duration: EXIT_DUR * 0.85 },
            EXIT_AT + 0.05
          )
          .to(".at-about .about-steps", { y: -50, opacity: 0, ease: "power1.inOut", duration: EXIT_DUR * 0.8 }, EXIT_AT)
          .to(".at-about .sh", { opacity: 0, duration: 0.3 }, EXIT_AT);

        // ...while the cream turns to black (it passes through greys on the way)
        tl.fromTo(".at-dark", { opacity: 0 }, { opacity: 1, duration: DARK_DUR }, DARK_AT);

        // 3) Services, only after the black is complete. Each piece is tied to the scrollbar.
        tl.fromTo(
          ".sv-label",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: SV_LABEL_DUR, ease: "power2.out" },
          SV_LABEL_AT
        ).fromTo(
          ".sv-title",
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: SV_TITLE_DUR, ease: "power2.out" },
          SV_TITLE_AT
        );
        rows.forEach((row, i) => {
          // first row from the left, second from the right, third from the left...
          const dir = i % 2 === 0 ? -1 : 1;
          tl.fromTo(
            row,
            { opacity: 0, x: dir * SV_ROW_SLIDE },
            { opacity: 1, x: 0, duration: SV_ROW_DUR, ease: "power2.out" },
            SV_ROWS_AT + i * SV_ROW_GAP
          );
        });

        // an empty tween stretches the timeline to exactly LENGTH, so the last bit is a calm hold
        tl.to({}, { duration: LENGTH }, 0);
        tl.eventCallback("onUpdate", () => sync(tl.time()));
        sync(0);

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