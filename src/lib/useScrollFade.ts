import { useEffect, useRef, useState } from 'react';

// Tracks whether a scroll container has content hidden above/below its
// visible edge, so the caller can mask those edges into a gradient fade
// (Fixnet • Wip, node 1314:81308) instead of clipping content abruptly.
// `deps` should include anything that changes how much content is inside
// the container (e.g. item count) — a ResizeObserver on the container only
// catches its own box resizing, not its scrollHeight growing while the box
// itself stays the same size.
export function useScrollFade<T extends HTMLElement>(deps: readonly unknown[] = []) {
  const ref = useRef<T>(null);
  const [fadeTop, setFadeTop] = useState(false);
  const [fadeBottom, setFadeBottom] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setFadeTop(el.scrollTop > 0);
      setFadeBottom(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }

    update();
    el.addEventListener('scroll', update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', update);
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, fadeTop, fadeBottom };
}
