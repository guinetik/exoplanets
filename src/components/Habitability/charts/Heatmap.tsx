/**
 * Heatmap
 * D3 heatmap chart for showing relationships between two categorical variables
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import D3Chart, { CHART_COLORS } from './D3Chart';
import type { HeatmapCell } from '../../../utils/habitabilityAnalytics';

interface HeatmapProps {
  data: HeatmapCell[];
  xLabels: string[];
  yLabels: string[];
  maxValue: number;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colorScheme?: 'blue' | 'green' | 'orange';
  showValues?: boolean;
}

export default function Heatmap({
  data,
  xLabels,
  yLabels,
  maxValue,
  title,
  xAxisLabel,
  yAxisLabel,
  colorScheme = 'blue',
  showValues = true,
}: HeatmapProps) {
  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">{title}</h3>
      <D3Chart aspectRatio={1.2} minHeight={300}>
        {({ width, height }) => (
          <HeatmapSVG
            data={data}
            xLabels={xLabels}
            yLabels={yLabels}
            maxValue={maxValue}
            width={width}
            height={height}
            xAxisLabel={xAxisLabel}
            yAxisLabel={yAxisLabel}
            colorScheme={colorScheme}
            showValues={showValues}
          />
        )}
      </D3Chart>
    </div>
  );
}

interface HeatmapSVGProps extends Omit<HeatmapProps, 'title'> {
  width: number;
  height: number;
}

function HeatmapSVG({
  data,
  xLabels,
  yLabels,
  maxValue,
  width,
  height,
  xAxisLabel,
  yAxisLabel,
  colorScheme,
  showValues,
}: HeatmapSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(xLabels)
      .range([0, innerWidth])
      .padding(0.05);

    const yScale = d3
      .scaleBand()
      .domain(yLabels)
      .range([0, innerHeight])
      .padding(0.05);

    // Color scale
    const colorRange =
      colorScheme === 'green'
        ? ['#0a1a0a', '#00ff88']
        : colorScheme === 'orange'
          ? ['#1a0a0a', '#ff8800']
          : ['#0a0a1a', '#00ccff'];

    const colorScale = d3
      .scaleSequential()
      .domain([0, maxValue])
      .interpolator(d3.interpolateRgb(colorRange[0], colorRange[1]));

    // Draw cells
    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d) => xScale(d.x) || 0)
      .attr('y', (d) => yScale(d.y) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => (d.value > 0 ? colorScale(d.value) : '#111'))
      .attr('stroke', '#222')
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // Draw values
    if (showValues) {
      g.selectAll('text.cell-value')
        .data(data.filter((d) => d.value > 0))
        .join('text')
        .attr('class', 'cell-value')
        .attr('x', (d) => (xScale(d.x) || 0) + xScale.bandwidth() / 2)
        .attr('y', (d) => (yScale(d.y) || 0) + yScale.bandwidth() / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', (d) => (d.value > maxValue * 0.6 ? '#000' : '#fff'))
        .attr('font-size', Math.min(xScale.bandwidth(), yScale.bandwidth()) * 0.35)
        .text((d) => d.value);
    }

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 11);

    g.selectAll('.domain, .tick line').attr('stroke', CHART_COLORS.axis);

    // Y axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 10);

    // X axis label
    if (xAxisLabel) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 45)
        .attr('text-anchor', 'middle')
        .attr('fill', CHART_COLORS.axis)
        .attr('font-size', 12)
        .text(xAxisLabel);
    }

    // Y axis label
    if (yAxisLabel) {
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -60)
        .attr('text-anchor', 'middle')
        .attr('fill', CHART_COLORS.axis)
        .attr('font-size', 12)
        .text(yAxisLabel);
    }
  }, [data, xLabels, yLabels, maxValue, width, height, colorScheme, showValues, xAxisLabel, yAxisLabel]);

  return <svg ref={svgRef} width={width} height={height} />;
}
