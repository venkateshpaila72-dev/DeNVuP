"use client";

import { useEffect, useRef } from "react";
import "./glow-cursor.css";

// ---- Tuning knobs ----
const CONFIG = {
  ringFollow: 14, // higher = ring follows the mouse more tightly
  idleDelay: 1200, // ms without movement before the gentle idle pulse starts
  trailMax: 32, // max trail particles alive at once
  trailPerPx: 0.1, // trail particles emitted per pixel moved
  trailMaxPerEvent: 3,
  trailLife: 0.7, // seconds
  trailSize: [1, 2.6], // px
};

const COLORS = [
  [255, 75, 31], // ember
  [244, 123, 32], // orange
  [255, 176, 32], // amber
];

type Particle = {
  on: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  c: number[];
};

type CursorState = "default" | "button" | "link" | "card" | "fox" | "text";

function getState(el: Element | null): CursorState {
  if (!el) return "default";
  if (el.closest("input, textarea, select")) return "text";
  if (el.closest(".btn, button, [role='button']")) return "button";
  if (el.closest(".work-card")) return "card";
  if (el.closest(".fox-wrap")) return "fox";
  if (el.closest("a")) return "link";
  return "default";
}

export default function GlowCursor() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Only for devices with a real mouse, and only if motion is allowed
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const rootEl = root.current;
    const ringEl = ring.current;
    const dotEl = dot.current;
    const cv = canvas.current;
    if (!rootEl || !ringEl || !dotEl || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    document.documentElement.classList.add("has-glow-cursor");

    // ---- canvas size ----
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // ---- trail particle pool (reused, never re-created) ----
    const pool: Particle[] = Array.from({ length: CONFIG.trailMax }, () => ({
      on: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, size: 1, c: COLORS[0],
    }));

    const emit = (x: number, y: number, dx: number, dy: number) => {
      const p = pool.find((q) => !q.on);
      if (!p) return;
      const [minS, maxS] = CONFIG.trailSize;
      p.on = true;
      p.x = x + (Math.random() - 0.5) * 4;
      p.y = y + (Math.random() - 0.5) * 4;
      p.vx = -dx * 2 + (Math.random() - 0.5) * 24;
      p.vy = -dy * 2 + (Math.random() - 0.5) * 24;
      p.age = 0;
      p.life = CONFIG.trailLife * (0.6 + Math.random() * 0.6);
      p.size = minS + Math.random() * (maxS - minS);
      p.c = COLORS[Math.floor(Math.random() * COLORS.length)];
    };

    // ---- state ----
    let mx = 0, my = 0; // real mouse position
    let rx = 0, ry = 0; // smoothed ring position
    let px = 0, py = 0; // previous mouse position
    let carry = 0;
    let seen = false;
    let visible = false;
    let idle = false;
    let dirty = false;
    let lastMove = 0;
    let state: CursorState = "default";
    let drewLastFrame = false;
    let raf = 0;
    let last = performance.now();

    const setVisible = (v: boolean) => {
      if (v === visible) return;
      visible = v;
      rootEl.classList.toggle("is-visible", v);
    };

    const setState = (s: CursorState) => {
      if (s === state) return;
      state = s;
      rootEl.dataset.state = s;
    };

    // ---- events ----
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX;
      my = e.clientY;

      if (!seen) {
        seen = true;
        rx = px = mx;
        ry = py = my;
      }

      lastMove = performance.now();
      setVisible(true);
      setState(getState(e.target as Element | null));

      // trail: emit along the path, more when moving faster
      const dx = mx - px;
      const dy = my - py;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) {
        const n = dist * CONFIG.trailPerPx + carry;
        const count = Math.min(Math.floor(n), CONFIG.trailMaxPerEvent);
        carry = Math.min(n - Math.floor(n), 0.99);
        for (let i = 0; i < count; i++) {
          const t = (i + 1) / (count + 1);
          emit(px + dx * t, py + dy * t, dx / Math.max(dist, 1), dy / Math.max(dist, 1));
        }
      }
      px = mx;
      py = my;
    };

    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget) setVisible(false); // left the browser window
    };
    const onDown = () => rootEl.classList.add("is-pressed");
    const onUp = () => rootEl.classList.remove("is-pressed");
    const onScroll = () => {
      dirty = true; // re-check what's under the cursor after scrolling
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("mouseout", onOut);

    // ---- animation loop ----
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      // ring follows with smooth easing, dot stays exactly on the pointer
      const k = 1 - Math.exp(-dt * CONFIG.ringFollow);
      rx += (mx - rx) * k;
      ry += (my - ry) * k;
      ringEl.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      dotEl.style.transform = `translate3d(${mx}px, ${my}px, 0)`;

      // gentle idle pulse
      const isIdle = seen && now - lastMove > CONFIG.idleDelay;
      if (isIdle !== idle) {
        idle = isIdle;
        rootEl.classList.toggle("is-idle", idle);
      }

      if (dirty && seen) {
        dirty = false;
        setState(getState(document.elementFromPoint(mx, my)));
      }

      // trail particles
      let active = 0;
      for (const p of pool) if (p.on) active++;

      if (active > 0) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.globalCompositeOperation = "lighter";
        for (const p of pool) {
          if (!p.on) continue;
          p.age += dt;
          if (p.age >= p.life) {
            p.on = false;
            continue;
          }
          const damp = Math.exp(-dt * 3.2);
          p.vx *= damp;
          p.vy *= damp;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          const t = p.age / p.life;
          const a = Math.pow(1 - t, 1.6) * 0.85;
          ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - t * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
        drewLastFrame = true;
      } else if (drewLastFrame) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        drewLastFrame = false;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      document.removeEventListener("mouseout", onOut);
      document.documentElement.classList.remove("has-glow-cursor");
    };
  }, []);

  return (
    <div ref={root} className="gc-root" data-state="default" aria-hidden="true">
      <canvas ref={canvas} className="gc-trail" />
      <div ref={ring} className="gc-ring">
        <div className="gc-body">
          <span className="gc-halo" />
          <span className="gc-outer" />
          <span className="gc-inner" />
        </div>
      </div>
      <div ref={dot} className="gc-dot">
        <span className="gc-dot-core" />
      </div>
    </div>
  );
}