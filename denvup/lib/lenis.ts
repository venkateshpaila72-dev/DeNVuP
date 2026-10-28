import type Lenis from "lenis";

// The one smooth-scroll instance (created in SmoothScroll.tsx), so other components can move the page with it.
let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}
export function getLenis() {
  return instance;
}