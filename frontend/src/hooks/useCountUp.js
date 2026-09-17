import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion.js';

/**
 * Animates a numeric value from 0 to `target` over `duration` ms.
 * Respects prefers-reduced-motion by snapping straight to the target.
 */
export function useCountUp(target, { duration = 900, decimals = 0 } = {}) {
  const [value, setValue] = useState(0);
  const reducedMotion = useReducedMotion();
  const frameRef = useRef();

  useEffect(() => {
    if (reducedMotion || target == null) {
      setValue(target || 0);
      return undefined;
    }

    const start = performance.now();
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, reducedMotion]);

  return Number(value.toFixed(decimals));
}
