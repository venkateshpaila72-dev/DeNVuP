"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import Reveal from "./Reveal";
import "./about-wipe.css";

// The "How we work" steps are the last part of About. They stay on screen while the mist rolls
// over them. Set SHOW_STEPS to false for a plain cream screen instead.
const SHOW_STEPS = true;

const steps = [
  { n: "01", title: "Discovery", text: "We learn about your business, goals and audience." },
  { n: "02", title: "Strategy", text: "We plan the structure, features and the roadmap." },
  { n: "03", title: "Design", text: "We craft the look, feel and user experience." },
  { n: "04", title: "Development", text: "We build it fast, clean and ready to scale." },
  { n: "05", title: "Launch", text: "We test, launch and support you after going live." },
];

// ---- Tuning knobs ----
// The animation runs from 0 to 1 while you scroll. The scroll distance is --aw-d in about-wipe.css
// (bigger = slower). These numbers say what happens inside that distance.
const WIPE_START = 0.03; // short pause before the first mist appears
const WIPE_END = 0.97; // the last (darkest) layer has covered the whole screen by here
const SOFTNESS = 1; // multiplies how feathered the mist edges are (1.4 = foggier, 0.7 = crisper)
const LAYER_HEIGHT = 1.9; // height of each mist layer as a multiple of the screen height (keep 1.8 or more)
const LAYER_WIDTH = 1.3; // width of each mist layer as a multiple of the screen width (wider = room to drift)
const COVER = 0.24; // how far each layer rises (as a fraction of its own height) to leave the screen fully dark. Smaller = finishes sooner

// The mist is built from four layers. The lightest, greyest one leads and the darkest follows, so
// the cream turns to grey haze, then charcoal, then the solid dark Services colour.
// edge = where the layer's edge sits, amp = how much the edge wanders, freq = how many bends across the screen,
// feather = how soft the edge is, from/to = when the layer starts and finishes rising (0 to 1),
// drift = how far it slides sideways while rising (fraction of the screen width).
type Layer = {
  color: [number, number, number];
  cap: number;
  edge: number;
  amp: number;
  freq: number;
  feather: number;
  seed: number;
  from: number;
  to: number;
  drift: number;
};
const LAYERS: Layer[] = [
  { color: [150, 142, 132], cap: 0.5, edge: 0.2, amp: 0.07, freq: 1.5, feather: 0.14, seed: 11, from: 0.0, to: 0.82, drift: 0.05 },
  { color: [104, 98, 92], cap: 0.72, edge: 0.18, amp: 0.08, freq: 2.0, feather: 0.12, seed: 29, from: 0.06, to: 0.88, drift: -0.04 },
  { color: [58, 54, 50], cap: 0.9, edge: 0.16, amp: 0.09, freq: 2.6, feather: 0.1, seed: 47, from: 0.12, to: 0.94, drift: 0.03 },
  { color: [17, 17, 17], cap: 1, edge: 0.14, amp: 0.08, freq: 1.8, feather: 0.08, seed: 83, from: 0.18, to: 1.0, drift: -0.02 },
];

// Must be identical to the media query used for the wipe layout in about-wipe.css
const WIPE_MQ = "(min-width: 900px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)";

// ---------- Soft noise (used once to draw the mist textures) ----------
function hash(x: number, y: number, s: number) {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function vnoise(x: number, y: number, s: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, s: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * vnoise(x * f, y * f, s + i * 13);
    f *= 2;
    amp *= 0.5;
  }
  return sum; // about 0 to 0.94
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

// Draws one mist layer into a small canvas. It is stretched up by the browser, which makes it
// even softer. Every pixel gets an opacity: 0 above the mist, a feathered, cloudy ramp along the edge,
// and the layer's full opacity below it.
function paintLayer(canvas: HTMLCanvasElement, L: Layer) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const img = ctx.createImageData(W, H);
  const px = img.data;
  const [r, g, b] = L.color;
  const feather = L.feather * SOFTNESS;

  // the wandering edge only depends on the column, so work it out once per column
  const edges = new Float32Array(W);
  for (let x = 0; x < W; x++) {
    const u = x / W;
    edges[x] = L.edge + L.amp * ((fbm(u * L.freq * 2, 0.5, L.seed, 3) - 0.47) * 2.1);
  }

  for (let y = 0; y < H; y++) {
    const v = y / H;
    const fadeTop = smooth(0, 0.05, v); // no hard cut at the very top of the layer
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const d = (v - edges[x]) / feather; // below 0 = above the edge, above 0 = below it
      const wisp = (fbm(u * 7, v * 5, L.seed + 5, 4) - 0.47) * 2.1; // cloudy variation inside the soft zone
      let a = smooth(-1, 1, d + wisp);
      a = Math.max(a, 0.18 * smooth(-4, 0, d + wisp * 2)); // faint haze above the edge
      a *= L.cap * fadeTop;
      const i = (y * W + x) * 4;
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
}

export default function AboutServicesWipe() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(WIPE_MQ, () => {
        const wrap = root.current;
        if (!wrap) return;
        const stage = wrap.querySelector<HTMLElement>(".aw-stage");
        const layers = gsap.utils.toArray<HTMLCanvasElement>(".aw-layer", wrap);
        if (!stage || layers.length !== LAYERS.length) return;

        // Draw the mist textures (and draw them again, shortly after, if the window changes shape)
        const paintAll = () => {
          const w = stage.clientWidth;
          const h = stage.clientHeight;
          if (!w || !h) return;
          const cw = 300;
          const ch = Math.min(520, Math.max(200, Math.round((cw * LAYER_HEIGHT * h) / (LAYER_WIDTH * w))));
          layers.forEach((c, i) => {
            c.width = cw;
            c.height = ch;
            paintLayer(c, LAYERS[i]);
          });
        };
        paintAll();

        let resizeTimer = 0;
        let firstCall = true;
        const ro = new ResizeObserver(() => {
          if (firstCall) {
            firstCall = false;
            return;
          }
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(paintAll, 150);
        });
        ro.observe(stage);

        const span = WIPE_END - WIPE_START;
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            end: "bottom bottom", // = the scroll distance --aw-d
            scrub: 1.2, // a little glide, so it feels smooth and cinematic
            invalidateOnRefresh: true,
          },
        });

        // Every layer starts just below the screen and rises until it is above the top.
        // They rise at different times and slide sideways a little, which gives the mist depth.
        layers.forEach((el, i) => {
          const L = LAYERS[i];
          const travel = () => stage.clientHeight * (1 + COVER * LAYER_HEIGHT);
          tl.fromTo(
            el,
            { y: 0, x: () => -L.drift * stage.clientWidth },
            {
              y: () => -travel(),
              x: () => L.drift * stage.clientWidth,
              ease: "none", // steady, unhurried movement; the scrub smoothing adds the glide
              duration: (L.to - L.from) * span,
            },
            WIPE_START + L.from * span
          );
        });

        // the About content drifts up a little while the mist covers it
        tl.fromTo(".aw-out-inner", { yPercent: 0 }, { yPercent: -5, duration: WIPE_END }, 0);
        // pad the timeline to exactly 1
        tl.to({}, { duration: 1 - WIPE_END }, WIPE_END);

        return () => {
          window.clearTimeout(resizeTimer);
          ro.disconnect();
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root} className="aw">
      <div className="aw-stage">
        {/* What you see while the mist rolls in: the end of About on cream */}
        <section className="aw-out" aria-label="How we work">
          {SHOW_STEPS && (
            <div className="container aw-out-inner">
              <p className="eyebrow">How we work</p>
              <h2 className="section-title">From idea to launch, step by step.</h2>
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
          )}
        </section>

        {/* Only a background: layers of mist, from light grey to the dark Services colour */}
        <div className="aw-in" aria-hidden="true">
          {LAYERS.map((_, i) => (
            <canvas key={i} className="aw-layer" />
          ))}
        </div>
      </div>
    </div>
  );
}