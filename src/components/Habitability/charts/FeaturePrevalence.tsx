/**
 * FeaturePrevalence
 * Horizontal bar chart showing the prevalence of boolean features
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import D3Chart, { CHART_COLORS } from './D3Chart';
import type { FeaturePrevalence as FeaturePrevalenceData } from '../../../utils/habitabilityAnalytics';

interface FeaturePrevalenceProps {
  data: FeaturePrevalenceData[];
  title: string;
  maxItems?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Habitability: '#00ff88',
  'Planet Type': '#ff8800',
  Orbital: '#00ccff',
  System: '#aa88ff',
  Star: '#ffd700',
};

export default function FeaturePrevalence({
  data,
  title,
  maxItems = 20,
}: FeaturePrevalenceProps) {
  const displayData = data.slice(0, maxItems);

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">{title}</h3>
      <D3Chart aspectRatio={0.8} minHeight={400}>
        {({ width, height }) => (
          <FeaturePrevalenceSVG
            data={displayData}
            width={width}
            height={height}
          />
        )}
      </D3Chart>
      <div className="chart-legend horizontal">
        {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
          <div key={category} className="legend-item">
            <span className="legend-dot" style={{ background: color }} />
            <span>{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FeaturePrevalenceSVGProps {
  data: FeaturePrevalenceData[];
  width: number;
  height: number;
}

function FeaturePrevalenceSVG({
  data,
  width,
  height,
}: FeaturePrevalenceSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 60, bottom: 30, left: 140 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerHeight])
      .padding(0.2);

    const xScale = d3
      .scaleLinear()
      .domain([0, Math.max(...data.map((d) => d.pct)) * 1.1])
      .range([0, innerWidth]);

    // Grid lines
    g.selectAll('line.grid')
      .data(xScale.ticks(5))
      .join('line')
      .attr('class', 'grid')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', CHART_COLORS.grid)
      .attr('stroke-dasharray', '2,2');

    // Bars
    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.label) || 0)
      .attr('width', (d) => xScale(d.pct))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => CATEGORY_COLORS[d.category] || CHART_COLORS.muted)
      .attr('rx', 2)
      .attr('opacity', 0.85);

    // Percentage labels
    g.selectAll('text.pct')
      .data(data)
      .join('text')
      .attr('class', 'pct')
      .attr('x', (d) => xScale(d.pct) + 5)
      .attr('y', (d) => (yScale(d.label) || 0) + yScale.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 11)
      .text((d) => `${d.pct.toFixed(1)}%`);

    // Y axis (labels)
    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll('text')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 11);

    g.selectAll('.domain').remove();

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat((d) => `${d}%`)
      )
      .selectAll('text')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 10);

    g.selectAll('.domain, .tick line').attr('stroke', CHART_COLORS.axis);
  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
