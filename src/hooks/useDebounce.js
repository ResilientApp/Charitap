import { useEffect, useState } from 'react';

/**
 * Debounce hook to delay updating a value until after delay has passed
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} - Debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook to limit function execution rate
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Minimum delay between executions in milliseconds
 * @returns {Function} - Throttled function
 */
export function useThrottle(callback, delay = 1000) {
  const [isThrottled, setIsThrottled] = useState(false);

  const throttledFunction = (...args) => {
    if (!isThrottled) {
      callback(...args);
      setIsThrottled(true);
      setTimeout(() => setIsThrottled(false), delay);
    } else {
      console.log('[Throttle] Request blocked - too many requests');
    }
  };

  return throttledFunction;
}
