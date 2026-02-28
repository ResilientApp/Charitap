import { useState, useEffect, useRef } from 'react';

/**
 * useDebounce
 *
 * Delays updating the returned value until the input value has not changed
 * for `delay` milliseconds. Use this to prevent firing API calls or expensive
 * computations on every keystroke.
 *
 * @param {*}      value - The value to debounce (any type)
 * @param {number} delay - Debounce delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 300);
 * useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */

const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel the timer if value or delay changes before it fires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
