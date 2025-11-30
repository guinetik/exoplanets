import { useState, useLayoutEffect, RefObject } from 'react';

interface Size {
  width: number;
  height: number;
}

function useResizeObserver<T extends HTMLElement>(ref: RefObject<T>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });

    resizeObserver.observe(element);

    return () => resizeObserver.unobserve(element);
  }, [ref]);

  return size;
}

export default useResizeObserver;

