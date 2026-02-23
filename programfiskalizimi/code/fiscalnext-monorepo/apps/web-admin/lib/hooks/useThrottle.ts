import { useRef, useEffect, useCallback } from 'react';

/**
 * ⚡ Throttle hook for scroll/resize events
 * Limits how often a function can be called
 * 
 * @param callback - Function to throttle
 * @param delay - Minimum time between calls in milliseconds (default: 200ms)
 * @returns Throttled callback
 * 
 * @example
 * const handleScroll = useThrottle(() => {
 *   console.log('Scroll event');
 * }, 200);
 * 
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 200
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args) => {
      const now = Date.now();
      const timeSinceLastRan = now - lastRan.current;

      if (timeSinceLastRan >= delay) {
        callback(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(
          () => {
            callback(...args);
            lastRan.current = Date.now();
          },
          delay - timeSinceLastRan
        );
      }
    }) as T,
    [callback, delay]
  );
}
