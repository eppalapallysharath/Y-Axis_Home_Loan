'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * @param {*} value - The input value to debounce
 * @param {number} [delay=300] - Delay in milliseconds
 * @returns {*} The debounced value
 */
export function useDebounce(value, delay = 300) {
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
