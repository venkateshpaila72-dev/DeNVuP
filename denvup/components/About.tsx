"use client";

import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap, useGSAP } from "../lib/gsap";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import "./about.css";
import "./about-spacing.css"; // keeps the About content and "How we work" close together

// Sample photos from Unsplash. Replace them with your own pictures:
// put files in public/about/ and use e.g. src: "/about/team.jpg"
// Tip: use wide (landscape) photos, roughly 4:3.
const IMAGE_LEFT = {
  src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  alt: "Laptop with code on the screen",
  tag: "Build",
};
const IMAGE_RIGHT = {
  src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  alt: "A team collaborating around laptops",
  tag: "Collaborate",
};

const HEADLINE = "We build digital experiences that make brands impossible to forget.";

const PARAGRAPHS = [
  "DENVUP is a creative digital agency that designs and builds websites for businesses that want to stand out online. We combine thoughtful design with clean, modern development, so every site looks distinctive and works smoothly on every device.",
  "Our work covers website development, UI/UX design, branding and AI-powered solutions. We start by understanding your goals and your audience, then shape a clear structure, a strong visual identity and an experience that is easy to use.",
  "We keep the process open and collaborative, from the first conversation to launch and beyond, because a good website is never just a page. It is a tool that helps your business connect with people and grow.",
];

const steps = [
  { n: "01", title: "Discovery", text: "We learn about your business, goals and audience." },
  { n: "02", title: "Strategy", text: "We plan the structure, features and the roadmap." },
  { n: "03", title: "Design", text: "We craft the look, feel and user experience." },
  { n: "04", title: "Development", text: "We build it fast, clean and ready to scale." },
  { n: "05", title: "Launch", text: "We test, launch and support you after going live." },
];

// Every word is its own span so it can light up on scroll and react to the cursor.
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="about-word">
          {w}
        </span>
      ))}
    </>
  );
}

// How far an element has to travel to start just outside the left / right edge of the screen.
function fromEdge(el: HTMLElement, dir: -1 | 1) {
  return () => {
    const rect = el.getBoundingClientRect();
    const x = Number(gsap.getProperty(el, "x")) || 0; // ignore the current animation offset
    const left = rect.left - x;
    const right = rect.right - x;
    return dir < 0 ? -(right + 40) : document.documentElement.clientWidth - left + 40;
  };
}

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Works on every screen size (unless motion is reduced)
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // The hero -> about background wipe lives in Hero.tsx. Here the content simply
        // fades in and moves up a little as the cream takes over.
        gsap.fromTo(
          ".about-eyebrow",
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: root.current, start: "top 55%", end: "top 20%", scrub: true },
          }
        );

        // Scroll-driven text: the headline and every paragraph light up word by word
        gsap.utils.toArray<HTMLElement>("[data-scrub-words]", root.current).forEach((block) => {
          gsap.fromTo(
            block.querySelectorAll(".about-word"),
            { opacity: 0.15 },
            {
              opacity: 1,
              stagger: 0.1,
              ease: "none",
              scrollTrigger: { trigger: block, start: "top 85%", end: "bottom 55%", scrub: true },
            }
          );
        });
      });

      // Desktop: the two landscape images fly in from the left and right edges of the screen
      mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        const grid = root.current?.querySelector<HTMLElement>(".about-grid");
        const left = root.current?.querySelector<HTMLElement>(".about-img-left");
        const right = root.current?.querySelector<HTMLElement>(".about-img-right");
        if (!grid || !left || !right) return;

        const entry = () => ({
          trigger: grid,
          start: "top 85%",
          end: "top 25%",
          scrub: 1,
          invalidateOnRefresh: true,
        });

        gsap.fromTo(
          left,
          { x: fromEdge(left, -1), opacity: 0, rotationY: 22, transformPerspective: 1000 },
          { x: 0, opacity: 1, rotationY: 0, ease: "power2.out", scrollTrigger: entry() }
        );
        gsap.fromTo(
          right,
          { x: fromEdge(right, 1), opacity: 0, rotationY: -22, transformPerspective: 1000 },
          { x: 0, opacity: 1, rotationY: 0, ease: "power2.out", scrollTrigger: entry() }
        );

        gsap.utils.toArray<HTMLElement>(".about-frame img", root.current).forEach((img) => {
          // slight zoom-out while the image arrives
          gsap.fromTo(img, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: entry() });
          // gentle parallax while the section passes
          gsap.fromTo(
            img,
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: "none",
              scrollTrigger: { trigger: grid, start: "top bottom", end: "bottom top", scrub: true },
            }
          );
        });
      });

      // Tablet / phone: images are stacked, so they just slide in a short way from each side
      mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".about-img", root.current).forEach((fig, i) => {
          gsap.fromTo(
            fig,
            { x: i === 0 ? -60 : 60, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              ease: "power2.out",
              scrollTrigger: { trigger: fig, start: "top 92%", end: "top 62%", scrub: true },
            }
          );
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="about" ref={root} className="about sh-host">
      <div className="about-bg" />

      <SectionHeading label="ABOUT" tone="light" />

      <div className="container about-grid">
        <figure className="about-img about-img-left">
          <div className="about-frame">
            <div className="about-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMAGE_LEFT.src} alt={IMAGE_LEFT.alt} loading="lazy" />
            </div>
            <span className="about-tag">{IMAGE_LEFT.tag}</span>
          </div>
        </figure>

        <div className="about-center">
          <p className="eyebrow about-eyebrow">About DENVUP</p>

          <h2 className="about-headline" data-scrub-words>
            <Words text={HEADLINE} />
          </h2>

          <div className="about-copy">
            {PARAGRAPHS.map((text, i) => (
              <p key={i} data-scrub-words>
                <Words text={text} />
              </p>
            ))}
          </div>

          <a href="#services" className="about-cta">
            <span className="about-cta-circle">
              <ArrowRight size={20} />
            </span>
            <span>Our services</span>
          </a>
        </div>

        <figure className="about-img about-img-right">
          <div className="about-frame">
            <div className="about-media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={IMAGE_RIGHT.src} alt={IMAGE_RIGHT.alt} loading="lazy" />
            </div>
            <span className="about-tag">{IMAGE_RIGHT.tag}</span>
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