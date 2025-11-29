/**
 * D3Chart
 * Base wrapper component for D3 charts with responsive sizing
 */

import { useRef, useEffect, useState, ReactNode } from 'react';

interface D3ChartProps {
  children: (dimensions: { width: number; height: number; isMobile: boolean }) => ReactNode;
  aspectRatio?: number;
  minHeight?: number;
  className?: string;
  mobileBreakpoint?: number;
}

export default function D3Chart({
  children,
  aspectRatio = 16 / 9,
  minHeight = 200,
  className = '',
  mobileBreakpoint = 600,
}: D3ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, isMobile: false });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const width = container.clientWidth;
      const height = Math.max(width / aspectRatio, minHeight);
      const isMobile = width < mobileBreakpoint;
      setDimensions({ width, height, isMobile });
    };

    // Initial measurement
    updateDimensions();

    // Resize observer for responsive updates
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [aspectRatio, minHeight, mobileBreakpoint]);

  return (
    <div ref={containerRef} className={`d3-chart-container ${className}`}>
      {dimensions.width > 0 && children(dimensions)}
    </div>
  );
}

// Shared chart margins
export const CHART_MARGINS = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 50,
};

// Color palette for charts
export const CHART_COLORS = {
  primary: '#00ccff',
  secondary: '#00ff88',
  tertiary: '#ffd700',
  highlight: '#ff8800',
  muted: '#666666',
  axis: '#888888',
  grid: '#333333',
  text: '#ffffff',
  goldilocks: 'rgba(0, 255, 136, 0.2)',
};
