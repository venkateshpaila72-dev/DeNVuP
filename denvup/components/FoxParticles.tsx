"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const LOGO_SRC = "/denvup-logo.png";

// ---- Tuning knobs ----
const COUNT_DESKTOP = 5600; // number of particles on desktop
const COUNT_MOBILE = 2800; // number of particles on phones
const PUSH = 75; // how strongly the cursor pushes particles away (max displacement)
const RADIUS_DESKTOP = 70; // cursor gap radius in CSS pixels
const RADIUS_MOBILE = 50;

// Formation animation
const FORM_SPEED = 1.5 // 1 = about 1.4 seconds. 1.3 = faster, 0.8 = slower
const K_FORM = 25; // spring strength pulling particles to the logo while forming
const K_SETTLED = 16; // spring strength after formation (also controls how fast they return from the cursor)
const START_MIN = 1.3; // closest start distance from the logo centre (1 unit = half the logo box)
const START_MAX = 2.1; // farthest start distance
const SWIRL = 0.6; // how much particle paths curve (0 = straight lines)
const CANVAS_SCALE = 2.2; // canvas is this many times larger than the logo box, so nothing is clipped

const VERT = `
  attribute vec3 aColor;
  attribute float aSize;
  attribute vec2 aTarget;
  uniform float uPR;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    // invisible while far from the final spot, fades in as the particle arrives
    vAlpha = 1.0 - smoothstep(0.9, 2.2, distance(position.xy, aTarget));
    gl_PointSize = aSize * uPR * uScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = `
  uniform float uFade;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.38, d) * uFade * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`;

// Read the logo pixels and turn the colored (non-white, non-black) ones into particle targets.
function sampleLogo(img: HTMLImageElement, count: number) {
  const S = 420;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, S, S);

  const sc = Math.min(S / img.width, S / img.height);
  const w = img.width * sc;
  const h = img.height * sc;
  ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);

  const data = ctx.getImageData(0, 0, S, S).data;
  const px: number[] = [];
  let minX = S, maxX = 0, minY = S, maxY = 0;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const sat = mx === 0 ? 0 : (mx - mn) / mx;
      // keep only bright, saturated (orange / red / yellow) pixels
      if (mx > 110 && sat > 0.4) {
        px.push(x, y, r, g, b);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const total = px.length / 5;
  const n = Math.min(count, total);

  // random pick of n pixels
  const idx = new Uint32Array(total);
  for (let i = 0; i < total; i++) idx[i] = i;
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (total - i));
    const t = idx[i];
    idx[i] = idx[j];
    idx[j] = t;
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = 1.9 / Math.max(maxX - minX, maxY - minY);

  const target = new Float32Array(n * 2);
  const colors = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    const p = idx[i] * 5;
    target[i * 2] = (px[p] + Math.random() - 0.5 - cx) * scale;
    target[i * 2 + 1] = -(px[p + 1] + Math.random() - 0.5 - cy) * scale;
    // slight brightness variation per particle (colours stay true to the logo)
    const bright = 0.85 + Math.random() * 0.15;
    colors[i * 3] = (px[p + 2] / 255) * bright;
    colors[i * 3 + 1] = (px[p + 3] / 255) * bright;
    colors[i * 3 + 2] = (px[p + 4] / 255) * bright;
  }

  return { target, colors, n };
}

const smooth = (x: number, a: number, b: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export default function FoxParticles() {
  const wrap = useRef<HTMLDivElement>(null);
  // The static logo is ONLY shown when particles cannot run
  // (reduced motion, no WebGL, or image failed to load). Never during normal loading.
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const wrapEl = wrap.current;
    if (!wrapEl) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFallback(true);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.className = "fox-canvas";
    // Canvas is larger than the logo box and centred on it, so particles are never clipped
    // into a rectangle. It is transparent and ignores the mouse.
    canvas.style.cssText = `position:absolute;left:50%;top:50%;width:${CANVAS_SCALE * 100}%;height:${
      CANVAS_SCALE * 100
    }%;transform:translate(-50%,-50%);display:block;pointer-events:none;`;
    wrapEl.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      canvas.remove();
      setFallback(true);
      return;
    }

    let disposed = false;
    let raf = 0;
    let visible = true;
    let radius = 0.3;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const pr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uPR: { value: pr },
        uScale: { value: 1 },
        uFade: { value: 0 },
      },
    });

    let geometry: THREE.BufferGeometry | null = null;

    const resize = () => {
      const w = wrapEl.clientWidth;
      const h = wrapEl.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w * CANVAS_SCALE, h * CANVAS_SCALE, false);
      // 1 world unit = half of the logo box height, the canvas extends beyond the box
      camera.left = -CANVAS_SCALE * (w / h);
      camera.right = CANVAS_SCALE * (w / h);
      camera.top = CANVAS_SCALE;
      camera.bottom = -CANVAS_SCALE;
      camera.updateProjectionMatrix();
      material.uniforms.uScale.value = Math.min(Math.max(h / 600, 0.6), 1.2);
      radius = ((isMobile ? RADIUS_MOBILE : RADIUS_DESKTOP) * 2) / h; // px -> world units
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrapEl);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(wrapEl);

    // ---- mouse / touch ----
    const mouse = { x: 1e3, y: 1e3, tx: 1e3, ty: 1e3, active: 0, want: 0 };

    const onMove = (e: PointerEvent) => {
      const r = wrapEl.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      if (nx < -0.05 || nx > 1.05 || ny < -0.05 || ny > 1.05) {
        mouse.want = 0;
        return;
      }
      const half = r.height / 2;
      const wx = (e.clientX - (r.left + r.width / 2)) / half;
      const wy = -(e.clientY - (r.top + r.height / 2)) / half;
      if (mouse.want === 0) {
        mouse.x = wx;
        mouse.y = wy;
      }
      mouse.tx = wx;
      mouse.ty = wy;
      mouse.want = 1;
    };
    const onLeave = () => {
      mouse.want = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onLeave);
    window.addEventListener("pointercancel", onLeave);
    window.addEventListener("blur", onLeave);
    document.addEventListener("pointerleave", onLeave);

    // ---- load logo (hidden, only used to read pixels) and build particles ----
    const img = new Image();
    img.onerror = () => {
      if (!disposed) setFallback(true);
    };
    img.onload = () => {
      if (disposed) return;

      const { target, colors, n } = sampleLogo(img, isMobile ? COUNT_MOBILE : COUNT_DESKTOP);

      const position = new Float32Array(n * 3);
      const vel = new Float32Array(n * 2);
      const delay = new Float32Array(n);
      const mult = new Float32Array(n);
      const swirl = new Float32Array(n);
      const sizes = new Float32Array(n);

      for (let i = 0; i < n; i++) {
        // start anywhere AROUND the logo (all directions, varied distance), not inside a box
        const a = Math.random() * Math.PI * 2;
        const rad = START_MIN + Math.pow(Math.random(), 0.8) * (START_MAX - START_MIN);
        position[i * 3] = Math.cos(a) * rad + (Math.random() - 0.5) * 0.3;
        position[i * 3 + 1] = Math.sin(a) * rad + (Math.random() - 0.5) * 0.3;

        // small sideways velocity so paths curve instead of going straight in
        const dir = Math.random() < 0.5 ? -1 : 1;
        const side = dir * (0.2 + Math.random() * 0.5);
        vel[i * 2] = -Math.sin(a) * side;
        vel[i * 2 + 1] = Math.cos(a) * side;

        swirl[i] = (Math.random() - 0.5) * 2 * SWIRL;
        // short stagger so particles arrive in waves, not all at once (0 to 0.35 s)
        delay[i] = Math.random() * (0.35 / FORM_SPEED);
        mult[i] = 0.7 + Math.random() * 0.6;
        // mix of small and medium particles (CSS px)
        sizes[i] = Math.random() < 0.7 ? 2 + Math.random() * 1.4 : 3.4 + Math.random() * 1.6;
      }

      geometry = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(position, 3);
      posAttr.setUsage(THREE.DynamicDrawUsage);
      geometry.setAttribute("position", posAttr);
      geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aTarget", new THREE.BufferAttribute(target, 2));

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);

      const t0 = performance.now();
      let last = t0;

      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        if (!visible) {
          last = now;
          return;
        }

        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        const t = (now - t0) / 1000;

        material.uniforms.uFade.value = Math.min(t / 0.3, 1);

        // strong spring while assembling, then settles to the normal spring
        const m = smooth(t, 0.9 / FORM_SPEED, 1.8 / FORM_SPEED);
        const kForm = K_FORM * FORM_SPEED * FORM_SPEED;
        const k = kForm + (K_SETTLED - kForm) * m;
        const damp = Math.exp(-2.04 * Math.sqrt(k) * dt); // slightly over-damped: no wobble
        const swirlOn = (1 - m) * k * dt;

        mouse.active += (mouse.want - mouse.active) * Math.min(dt * 10, 1);
        const follow = Math.min(dt * 18, 1);
        mouse.x += (mouse.tx - mouse.x) * follow;
        mouse.y += (mouse.ty - mouse.y) * follow;

        const useMouse = mouse.active > 0.01;
        const R = radius;
        const R2 = R * R;

        for (let i = 0; i < n; i++) {
          if (t < delay[i]) continue;

          const i2 = i * 2;
          const i3 = i * 3;
          let px = position[i3];
          let py = position[i3 + 1];
          let vx = vel[i2];
          let vy = vel[i2 + 1];

          // spring back to the logo shape
          const ex = target[i2] - px;
          const ey = target[i2 + 1] - py;
          vx += ex * k * dt;
          vy += ey * k * dt;

          // gentle swirl while travelling (fades out after formation)
          vx += -ey * swirl[i] * swirlOn;
          vy += ex * swirl[i] * swirlOn;

          // push away from cursor: strongest at the cursor, fades out smoothly (squared falloff)
          if (useMouse) {
            const dx = px - mouse.x;
            const dy = py - mouse.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) + 1e-4;
              const q = 1 - d / R;
              const f = q * q * PUSH * mult[i] * mouse.active;
              vx += (dx / d) * f * dt;
              vy += (dy / d) * f * dt;
            }
          }

          vx *= damp;
          vy *= damp;
          px += vx * dt;
          py += vy * dt;

          vel[i2] = vx;
          vel[i2 + 1] = vy;
          position[i3] = px;
          position[i3 + 1] = py;
        }

        posAttr.needsUpdate = true;
        renderer.render(scene, camera);
      };

      raf = requestAnimationFrame(tick);
    };
    img.src = LOGO_SRC;

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onLeave);
      window.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("pointerleave", onLeave);
      ro.disconnect();
      io.disconnect();
      geometry?.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return (
    <div ref={wrap} className="fox-wrap" role="img" aria-label="DENVUP fox logo made of glowing particles">
      {fallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={LOGO_SRC} alt="" className="fox-fallback" />
      )}
    </div>
  );
}