/* =====================================================================
   Step-by-step scrolling for the pinned hero.

   While the hero is pinned, ONE scroll gesture (a wheel flick, a swipe, a key press) moves exactly ONE
   step, however fast or hard you scroll. Scrolling the other way moves one step back. After the last
   step, scrolling simply continues into the page.

   This file only contains the decisions (no DOM, no GSAP, no Lenis), so it can be tested on its own.
   Hero.tsx connects it to the real wheel / touch / keyboard events and moves the page.
   ===================================================================== */

export type Decision = {
  consume: boolean; // true = swallow this event (do not let the page scroll by itself)
  target?: number; // if set: scroll to this position (relative to the start of the pinned area)
};

export type StepperOptions = {
  steps: number; // how many steps the pinned area has (the hero has 3)
  getY: () => number; // current scroll position, relative to the start of the pinned area
  getUnit: () => number; // distance between two steps in px
  stepMs: number; // how long one step takes to play
  idleMs?: number; // a wheel is "finished" after this much silence
};

const EDGE = 2; // px of tolerance at the ends

export function createStepper(o: StepperOptions) {
  const idleMs = o.idleMs ?? 160;
  let lastAt = -Infinity; // time of the most recent wheel / key / swipe event
  let locked = false; // true while the current gesture has already been used for a step
  let busyUntil = 0; // a step is playing until this time

  const end = () => o.steps * o.getUnit();

  // Is this direction handled by the stepper at the current position?
  // Down: anywhere before the last step. Up: anywhere after the top, up to (and including) the last step.
  const inZone = (dir: 1 | -1) => {
    const y = o.getY();
    return dir > 0 ? y < end() - EDGE : y > EDGE && y <= end() + EDGE;
  };

  /** A wheel / key / swipe event. dir: +1 = scrolling down, -1 = scrolling up. */
  function onGesture(dir: 1 | -1, now: number, opts?: { fresh?: boolean }): Decision {
    const gap = opts?.fresh ? Infinity : now - lastAt;
    lastAt = now;
    if (gap > idleMs) locked = false; // silence: this is a new gesture

    // the rest of a flick that already moved a step (trackpads keep sending events for a while)
    if (locked) return { consume: true };

    // outside the pinned area: normal scrolling
    if (!inZone(dir)) return { consume: false };

    // a step is still playing: swallow this event
    if (now < busyUntil) return { consume: true };

    const unit = o.getUnit();
    const cur = o.getY() / unit;
    let k = dir > 0 ? Math.floor(cur + 1e-3) + 1 : Math.ceil(cur - 1e-3) - 1;
    k = Math.max(0, Math.min(o.steps, k));

    locked = true;
    busyUntil = now + o.stepMs + 80;
    return { consume: true, target: k * unit };
  }

  /** Should a touch-drag in this direction be blocked (so the page does not scroll by itself)? */
  function intercepts(dir: 1 | -1, now: number) {
    return inZone(dir) || now < busyUntil;
  }

  /**
   * The scroll position changed. If someone scrolling UP (by wheel or keys) just carried the page from
   * About back into the pinned hero, stop exactly on the last step, so it is seen before going back.
   * Returns the position to jump to, or null. (Links and the scrollbar are not affected.)
   */
  function onPosition(prevY: number, y: number, now: number): number | null {
    const e = end();
    const byGesture = now - lastAt < 350;
    if (byGesture && prevY > e + EDGE && y <= e + EDGE && y < prevY) {
      locked = true;
      return e;
    }
    return null;
  }

  return { onGesture, intercepts, onPosition };
}