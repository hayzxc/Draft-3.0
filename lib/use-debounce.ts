import { useState, useEffect } from "react";

/**
 * Custom hook to debounce any fast-changing value.
 * Used to prevent rapid re-rendering/recompilation of heavy PDF documents while typing.
 */
export function useDebounce<T>(value: T, delayMs: number = 700): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
