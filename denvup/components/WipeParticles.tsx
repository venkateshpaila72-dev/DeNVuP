"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Soft ember dust that drifts upward on the cream layer during the Hero -> About transition.
// `level.current.v` (0 to 1) is set by the scroll timeline in Hero.tsx and controls how visible it is.
type Props = { level: { current: { v: number } } };

const COUNT_DESKTOP = 320;
const COUNT_MOBILE = 160;

const VERT = `
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPR;
  uniform float uLevel;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vec3 p = position;
    // slow upward drift that wraps around, plus a little sideways sway
    p.y = mod(p.y + uTime * (0.025 + aSeed * 0.05) + 1.0, 2.0) - 1.0;
    p.x += sin(uTime * 0.6 + aSeed * 40.0) * 0.03;
    vAlpha = uLevel * (0.35 + 0.65 * aSeed);
    gl_PointSize = aSize * uPR;
    gl_Position = vec4(p.xy, 0.0, 1.0);
  }
`;

const FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.2, d) * vAlpha;
    gl_FragColor = vec4(vColor, a);
  }
`;

export default function WipeParticles({ level }: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = wrap.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the transition still works, just without the dust
    }

    const pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = "wipe-canvas";
    host.appendChild(canvas);

    const count = window.innerWidth < 768 ? COUNT_MOBILE : COUNT_DESKTOP;
    const position = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    const color = new Float32Array(count * 3);
    const palette = [new THREE.Color("#ff4b1f"), new THREE.Color("#f47b20"), new THREE.Color("#ffb020")];

    for (let i = 0; i < count; i++) {
      position[i * 3] = Math.random() * 2 - 1;
      position[i * 3 + 1] = Math.random() * 2 - 1;
      position[i * 3 + 2] = 0;
      size[i] = 2 + Math.random() * 4;
      seed[i] = Math.random();
      const c = palette[Math.floor(Math.random() * palette.length)];
      color[i * 3] = c.r;
      color[i * 3 + 1] = c.g;
      color[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(color, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPR: { value: pr }, uLevel: { value: 0 } },
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(points);
    const camera = new THREE.Camera();

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w && h) renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let raf = 0;
    let last = performance.now();
    let t = 0;
    let wasVisible = false;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const lv = level.current.v;

      if (lv < 0.002) {
        // invisible: draw one empty frame, then do nothing (saves battery)
        if (wasVisible) {
          material.uniforms.uLevel.value = 0;
          renderer.render(scene, camera);
          wasVisible = false;
        }
        return;
      }
      wasVisible = true;
      t += dt;
      material.uniforms.uTime.value = t;
      material.uniforms.uLevel.value = lv;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [level]);

  return <div ref={wrap} className="wipe-particles" aria-hidden="true" />;
}