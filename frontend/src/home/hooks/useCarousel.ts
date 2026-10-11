import { useEffect, useState } from 'react';

export function useCarousel(length: number, intervalMs = 6000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [length, intervalMs]);

  return { index };
}
