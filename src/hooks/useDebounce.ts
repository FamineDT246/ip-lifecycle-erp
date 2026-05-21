// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * Performance optimization hook that delays state updates.
 * Prevents database throttling and API rate-limiting during live search inputs.
 * 
 * @param value - The rapidly changing value (e.g., search input state)
 * @param delay - Milliseconds to wait after the user stops typing (default: 500ms)
 * @returns The debounced value that only updates once typing stops
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: clears the timer if the value changes before the delay ends
    // This is what actually creates the "debouncing" effect
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}