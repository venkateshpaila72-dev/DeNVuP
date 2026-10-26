"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "../lib/gsap";
import "./ink-wipe.css";

// About -> Services transition.
// The dark background of the Services section rises from the bottom of the screen with a rough,
// soft edge (and a few drips of the About cream hanging into it), covers the end of the About
// section and finally the whole screen. Only after that do the Services contents appear
// (Services.tsx does that part). Scrolling back up plays everything in reverse.
//
// One small three.js shader draws the edge. Above the top line of the Services section the layer
// paints the dark colour (it covers About), below that line it paints cream (it hides the dark
// Services top until the edge has passed), so the two colours always match what is underneath and
// there is never a visible seam. The edge position is computed from where Services is on the screen.
// Place <InkWipe /> as the first child of the Services section.

// ---- Tuning knobs ----
const CREAM = [0xf5, 0xef, 0xe4]; // same as --cream (the About background)
const DARK = [0x11, 0x11, 0x11]; // same as --obsidian (the Services background)
const FROM = 0.85; // starts when the top of Services reaches 85% of the screen height (near the bottom)...
const TO = 0.3; // ...and the whole screen is dark when it reaches 30% (the Services contents appear then)
const DRIP = 210; // length of the longest drip (px)

const clamp = (v: number, a = 0, b = 1) => Math.min(Math.max(v, a), b);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = `
  uniform vec2 uRes;     // canvas size in css px
  uniform float uLine;   // y of the top line of the Services section inside the canvas (px)
  uniform float uEdge;   // y of the average edge inside the canvas (px)
  uniform float uDrip;   // length of the longest drip (px)
  uniform float uTopM;   // how far above the edge it can still be bumpy (px)
  uniform float uReach;  // how far below the edge anything can reach (px)
  uniform float uS;      // overall size factor (1 on a normal desktop screen)
  uniform float uPhase;  // 0..1 scroll progress, makes the shape change very slightly
  uniform vec3 uCream;
  uniform vec3 uDark;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
  float vnoise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
  }

  // The rough edge: five layers of bumps, from very wide to small (measured from the reference)
  float rough(float x) {
    float s = x / uS;
    float v = 0.0;
    v += 62.0  * (vnoise(s / 1400.0 + 3.7  + uPhase * 0.10) - 0.5);
    v += 83.0  * (vnoise(s / 700.0  + 11.3 + uPhase * 0.15) - 0.5);
    v += 134.0 * (vnoise(s / 350.0  + 23.1 + uPhase * 0.20) - 0.5);
    v += 114.0 * (vnoise(s / 175.0  + 41.9 + uPhase * 0.25) - 0.5);
    v += 87.0  * (vnoise(s / 90.0   + 57.3 + uPhase * 0.30) - 0.5);
    return v * uS * 0.85;
  }
  float baseAt(float x) { return uEdge + rough(x); }

  // smooth union: drips melt into the edge (the "liquid" look)
  float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
  }

  void main() {
    vec2 p = vec2(vUv.x * uRes.x, (1.0 - vUv.y) * uRes.y); // px from the top-left corner

    // inside = 1 above the edge (the About side), 0 below it (the dark Services side)
    float inside;
    if (p.y < uEdge - uTopM) {
      inside = 1.0;
    } else if (p.y > uEdge + uReach) {
      inside = 0.0;
    } else {
      // distance to the rough edge (corrected for slope, so the edge is equally soft everywhere)
      float b0 = baseAt(p.x);
      float slope = (baseAt(p.x + 1.5) - baseAt(p.x - 1.5)) / 3.0;
      float d = (p.y - b0) / sqrt(1.0 + slope * slope);

      // a few fat drips of the About side that hang into the dark, tapering to a round tip
      float cw = 260.0 * uS;
      float cj = floor(p.x / cw);
      for (int k = -1; k <= 1; k++) {
        float i = cj + float(k);
        float h1 = hash(i * 4.13 + 11.0);
        float h2 = hash(i * 6.77 + 2.0);
        float h3 = hash(i * 8.91 + 5.0);
        if (h1 < 0.22) continue;                     // not every cell has a drip
        float cx = (i + 0.5 + (h2 - 0.5) * 0.7) * cw;
        float len = uDrip * (0.35 + 0.65 * h3);
        float r = (26.0 + 22.0 * h2) * uS * clamp(len / (45.0 * uS), 0.0, 1.0); // drips shrink away at the end
        float y0 = baseAt(cx) - 30.0 * uS;
        float y1 = baseAt(cx) + len;
        float t = clamp((p.y - y0) / max(y1 - y0, 1.0), 0.0, 1.0);
        float cap = length(vec2(p.x - cx, p.y - clamp(p.y, y0, y1))) - mix(r * 1.25, r, t);
        d = smin(d, cap, 34.0 * uS);
      }
      inside = 1.0 - smoothstep(-2.0, 2.0, d);
    }

    if (p.y >= uLine) {
      gl_FragColor = vec4(uCream, inside);        // below the Services top line: cream hides the dark until the edge has passed
    } else {
      gl_FragColor = vec4(uDark, 1.0 - inside);   // above the line: dark covers the About section
    }
  }
`;

export default function InkWipe() {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current;
    const section = host?.parentElement; // the Services section
    if (!host || !section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
    } catch {
      return; // no WebGL: the page still works, the sections just meet normally
    }
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = "ink-canvas";
    host.appendChild(canvas);
    canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uRes: { value: new THREE.Vector2(1, 1) },
        uLine: { value: 0 },
        uEdge: { value: 0 },
        uDrip: { value: 0 },
        uTopM: { value: 0 },
        uReach: { value: 0 },
        uS: { value: 1 },
        uPhase: { value: 0 },
        // sRGB values written straight to the canvas, so the colours match the sections exactly
        uCream: { value: new THREE.Vector3(CREAM[0] / 255, CREAM[1] / 255, CREAM[2] / 255) },
        uDark: { value: new THREE.Vector3(DARK[0] / 255, DARK[1] / 255, DARK[2] / 255) },
      },
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(mesh);
    const camera = new THREE.Camera();

    let width = 1;
    let above = 0; // how far the layer reaches up over the About section (px)
    let current = 0; // eased progress
    let lastS = -1;
    let lastY = 1e9;

    const sizeFactor = () => clamp(window.innerHeight / 900, 0.65, 1.15) * (width < 700 ? 0.7 : 1);

    const resize = () => {
      width = host.clientWidth || 1;
      const vh = window.innerHeight;
      above = Math.round(TO * vh + 215 * 1.15 + 160);
      const below = Math.round(0.15 * vh + 215 * 1.15 + 30 + DRIP * 1.15 + 160);
      host.style.top = `${-above}px`;
      host.style.height = `${above + below}px`;
      // the edge is soft anyway, so a lower pixel ratio keeps the shader light on laptops
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1) * 0.8);
      renderer.setSize(width, above + below, false);
      material.uniforms.uRes.value.set(width, above + below);
      material.uniforms.uLine.value = above;
      lastS = -1; // draw again
    };
    resize();

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);

    const tick = (_t: number, deltaMs: number) => {
      const vh = window.innerHeight;
      const y = section.getBoundingClientRect().top; // where the top of Services is on the screen

      // progress: 0 when Services is near the bottom of the screen, 1 when the whole screen is dark
      const target = clamp((FROM * vh - y) / ((FROM - TO) * vh));
      current += (target - current) * (1 - Math.exp(-deltaMs / 80));

      if (y > vh * 1.4 || y < -vh * 0.6) return; // far away, nothing to draw
      const settled = current > 0.9995; // fully dark: the picture no longer changes while you scroll on
      if (settled && lastS > 0.9995) return;
      if (Math.abs(current - lastS) < 0.0002 && Math.abs(y - lastY) < 0.3) return;
      lastS = current;
      lastY = y;

      const s = clamp(current);
      const S = sizeFactor();
      // the edge travels from below the screen to above it, a little slower at both ends
      const q = 0.5 * s + 0.5 * smoothstep(0, 1, s);
      const from = vh + 215 * S + 30;
      const to = -(215 * S + 100);
      const edgeOnScreen = from + (to - from) * q;
      const drip = DRIP * S * smoothstep(0.1, 0.62, s) * (1 - smoothstep(0.62, 0.88, s)); // drips stretch, then pull back

      const u = material.uniforms;
      u.uEdge.value = above + (edgeOnScreen - y); // the same edge, measured from the top of the canvas
      u.uDrip.value = drip;
      u.uTopM.value = 215 * S + 10;
      u.uReach.value = 215 * S + drip + 90 * S + 20;
      u.uS.value = S;
      u.uPhase.value = s;

      renderer.render(scene, camera);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={wrap} className="ink-wipe" aria-hidden="true" />;
}