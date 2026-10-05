import { useCallback, useState } from 'react';

export function useCarousel(length: number) {
  const [index, setIndex] = useState(0);

  const previous = useCallback(() => {
    setIndex((current) => (current - 1 + length) % length);
  }, [length]);

  const next = useCallback(() => {
    setIndex((current) => (current + 1) % length);
  }, [length]);

  return { index, setIndex, previous, next };
}
