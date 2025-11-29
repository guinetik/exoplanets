/**
 * ChartLegend Component
 * Reusable responsive legend for D3 charts
 * Handles mobile (vertical stack) and desktop (horizontal wrap) layouts automatically
 */

import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export interface LegendItem {
  color: string;
  text: string;
  type: 'rect' | 'line' | 'circle'; // Shape type for legend
  lineStyle?: 'solid' | 'dashed'; // For line type
  size?: number; // For circle/rect size (default 12px)
}

interface ChartLegendProps {
  items: LegendItem[];
  width: number;
  isMobile: boolean;
  yOffset?: number; // Vertical offset from chart bottom
}

/**
 * Renders a responsive legend using D3
 * Mobile: vertical stack on left
 * Desktop: horizontal wrap, centered below chart
 */
export function renderLegend(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  items: LegendItem[],
  options: {
    x: number;
    y: number;
    width: number;
    isMobile: boolean;
    fontSize?: number;
    padding?: number;
  }
): { width: number; height: number } {
  const {
    x,
    y,
    width: availableWidth,
    isMobile,
    fontSize = 10,
    padding = 25,
  } = options;

  const legendGroup = svg.append('g').attr('class', 'chart-legend');

  const itemSize = 12;
  const itemPadding = 8;
  const rowHeight = 18;

  // Create individual legend items
  const legendNodes = items.map((item) => {
    const g = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));

    // Draw shape
    if (item.type === 'rect') {
      g.append('rect')
        .attr('width', item.size ?? itemSize)
        .attr('height', item.size ?? itemSize)
        .attr('fill', item.color)
        .attr('rx', 2);
    } else if (item.type === 'circle') {
      g.append('circle')
        .attr('r', (item.size ?? itemSize) / 2)
        .attr('fill', item.color);
    } else if (item.type === 'line') {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', item.size ?? itemSize)
        .attr('y1', (item.size ?? itemSize) / 2)
        .attr('y2', (item.size ?? itemSize) / 2)
        .attr('stroke', item.color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', item.lineStyle === 'dashed' ? '4,2' : 'none');
    }

    // Add text label
    const text = g
      .append('text')
      .attr('x', itemPadding + itemSize)
      .attr('y', (item.size ?? itemSize) / 2 + 4)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('font-size', `${fontSize}px`)
      .attr('dominant-baseline', 'middle')
      .text(item.text);

    const bbox = (text.node() as SVGTextElement).getBBox();
    const itemWidth = itemSize + itemPadding + bbox.width + padding;

    return { g, width: itemWidth, height: rowHeight };
  });

  // Layout items
  let totalWidth = 0;
  let totalHeight = rowHeight;

  if (isMobile) {
    // Mobile: one per row, left-aligned
    legendNodes.forEach((node, i) => {
      legendGroup.append(() => node.g.attr('transform', `translate(0, ${i * rowHeight})`).node()!);
      totalWidth = Math.max(totalWidth, node.width);
    });
    totalHeight = legendNodes.length * rowHeight;
  } else {
    // Desktop: wrap horizontally
    let currentX = 0;
    let currentY = 0;
    let maxWidth = 0;

    legendNodes.forEach((node) => {
      // Check if item fits on current row
      if (currentX > 0 && currentX + node.width > availableWidth) {
        // Wrap to next row
        currentX = 0;
        currentY += rowHeight;
      }

      legendGroup.append(() =>
        node.g.attr('transform', `translate(${currentX}, ${currentY})`).node()!
      );

      currentX += node.width;
      maxWidth = Math.max(maxWidth, currentX);
    });

    totalWidth = maxWidth;
    totalHeight = currentY + rowHeight;
  }

  // Position the legend group
  const legendX = isMobile ? x : x + (availableWidth - totalWidth) / 2;
  legendGroup.attr('transform', `translate(${legendX}, ${y})`);

  // Add background box
  svg
    .insert('rect', '.chart-legend')
    .attr('x', legendX - 10)
    .attr('y', y - 5)
    .attr('width', totalWidth + 20)
    .attr('height', totalHeight + 10)
    .attr('fill', 'rgba(0, 0, 0, 0.6)')
    .attr('stroke', 'rgba(255, 255, 255, 0.3)')
    .attr('stroke-width', 1)
    .attr('rx', 4);

  return { width: totalWidth, height: totalHeight };
}

/**
 * React component wrapper for legend (if needed for composition)
 */
export function ChartLegend({
  items,
  width,
  isMobile,
  yOffset = 50,
}: ChartLegendProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    renderLegend(svg, items, {
      x: 0,
      y: yOffset,
      width,
      isMobile,
    });
  }, [items, width, isMobile, yOffset]);

  return <svg ref={svgRef} width={width} height={300} />;
}

export default ChartLegend;
