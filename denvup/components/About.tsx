"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import Reveal from "./Reveal";
import SectionWords from "./SectionWords";
import "./about.css";

// Sample photos from Unsplash. Replace them with your own pictures:
// put files in public/about/ and use e.g. src: "/about/team.jpg"
const IMAGE_LEFT = {
  src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  alt: "Laptop with code on the screen",
};
const IMAGE_RIGHT = {
  src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
  alt: "A team collaborating around laptops",
};

const HEADLINE = "We build digital experiences that make brands impossible to forget.";

const steps = [
  { n: "01", title: "Discovery", text: "We learn about your business, goals and audience." },
  { n: "02", title: "Strategy", text: "We plan the structure, features and the roadmap." },
  { n: "03", title: "Design", text: "We craft the look, feel and user experience." },
  { n: "04", title: "Development", text: "We build it fast, clean and ready to scale." },
  { n: "05", title: "Launch", text: "We test, launch and support you after going live." },
];

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Works on every screen size (unless motion is reduced)
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The cream sheet starts narrower with rounded top corners, then widens as you scroll in from the hero
        gsap.fromTo(
          ".about-bg",
          { clipPath: "inset(0% 5% 0% 5% round 48px 48px 0px 0px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 0px 0px 0px 0px)",
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 95%", end: "top 35%", scrub: true },
          }
        );

        // Headline words light up as you scroll (the existing effect)
        gsap.fromTo(
          ".about-word",
          { opacity: 0.15 },
          {
            opacity: 1,
            stagger: 0.1,
            ease: "none",
            scrollTrigger: { trigger: ".about-headline", start: "top 80%", end: "bottom 50%", scrub: true },
          }
        );
      });

      // Desktop only: images slide in from the edges, plus parallax
      mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const grid = root.current?.querySelector<HTMLElement>(".about-grid");
        if (!grid) return;

        const entry = () => ({ trigger: grid, start: "top 88%", end: "top 30%", scrub: 1 });

        gsap.fromTo(
          ".about-img-left",
          { xPercent: -170, opacity: 0 },
          { xPercent: 0, opacity: 1, ease: "power2.out", scrollTrigger: entry() }
        );
        gsap.fromTo(
          ".about-img-right",
          { xPercent: 170, opacity: 0 },
          { xPercent: 0, opacity: 1, ease: "power2.out", scrollTrigger: entry() }
        );

        gsap.utils.toArray<HTMLElement>(".about-frame img", root.current).forEach((img) => {
          // slight zoom-out while the image arrives
          gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: entry() });
          // gentle parallax while the section passes
          gsap.fromTo(
            img,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: grid, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="about sw-host">
      <div className="about-bg" />

      <SectionWords words={["WHO", "WE", "ARE"]} tone="light" />

      <div className="container about-grid">
        <figure className="about-img about-img-left">
          <div className="about-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGE_LEFT.src} alt={IMAGE_LEFT.alt} loading="lazy" />
          </div>
        </figure>

        <div className="about-center">
          <p className="eyebrow">About DENVUP</p>

          <h2 className="about-headline">
            {HEADLINE.split(" ").map((w, i) => (
              <span key={i} className="about-word">
                {w}
              </span>
            ))}
          </h2>

          <div className="about-copy">
            <Reveal>
              <p>
                DENVUP is a creative digital agency that designs and builds websites for businesses
                that want to stand out online. We combine thoughtful design with clean, modern
                development, so every site looks distinctive and works smoothly on every device.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <p>
                Our work covers website development, UI/UX design, branding and AI-powered solutions.
                We start by understanding your goals and your audience, then shape a clear structure,
                a strong visual identity and an experience that is easy to use.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <p>
                We keep the process open and collaborative, from the first conversation to launch and
                beyond, because a good website is never just a page. It is a tool that helps your
                business connect with people and grow.
              </p>
            </Reveal>
          </div>
        </div>

        <figure className="about-img about-img-right">
          <div className="about-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGE_RIGHT.src} alt={IMAGE_RIGHT.alt} loading="lazy" />
          </div>
        </figure>
      </div>

      <div className="container about-steps">
        <p className="eyebrow">How we work</p>
        <div className="process-grid">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1}>
              <div className="step">
                <span className="step-num">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}