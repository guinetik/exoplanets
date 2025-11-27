/**
 * StarTypeChart
 * Horizontal bar chart showing average habitability score by star class
 */

import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import D3Chart, { CHART_MARGINS, CHART_COLORS } from './D3Chart';
import type { StarTypeStats } from '../../../utils/habitabilityAnalytics';

interface StarTypeChartProps {
  data: StarTypeStats[];
}

// Star class colors (roughly matching spectral type)
const STAR_COLORS: Record<string, string> = {
  O: '#9bb0ff',
  B: '#aabfff',
  A: '#cad7ff',
  F: '#f8f7ff',
  G: '#fff4ea', // Sun-like
  K: '#ffd2a1',
  M: '#ffcc6f',
  L: '#ff8800',
  T: '#ff6666',
  Y: '#cc4444',
  Unknown: '#888888',
};

export default function StarTypeChart({ data }: StarTypeChartProps) {
  const { t } = useTranslation();

  // Filter to main sequence types with enough data
  const filteredData = data.filter(
    (d) => ['F', 'G', 'K', 'M'].includes(d.starClass) && d.count >= 10
  );

  return (
    <div className="insight-card">
      <h3 className="card-title">
        {t('pages.habitability.insights.starType.title')}
      </h3>
      <p className="card-description">
        {t('pages.habitability.insights.starType.description')}
      </p>
      <D3Chart aspectRatio={2}>
        {(dimensions) => <StarBars data={filteredData} {...dimensions} />}
      </D3Chart>
    </div>
  );
}

interface StarBarsProps {
  data: StarTypeStats[];
  width: number;
  height: number;
}

function StarBars({ data, width, height }: StarBarsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!svgRef.current || width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { ...CHART_MARGINS, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Sort by average score descending
    const sortedData = [...data].sort((a, b) => b.avgScore - a.avgScore);

    // Scales
    const y = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.starClass))
      .range([0, innerHeight])
      .padding(0.3);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(sortedData, (d) => d.avgScore) || 50])
      .nice()
      .range([0, innerWidth]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisBottom(x)
          .tickSize(innerHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', CHART_COLORS.grid)
      .attr('stroke-opacity', 0.5);

    g.selectAll('.grid .domain').remove();

    // Bars
    g.selectAll('.bar')
      .data(sortedData)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', (d) => y(d.starClass) || 0)
      .attr('x', 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.avgScore))
      .attr('fill', (d) => STAR_COLORS[d.starClass] || CHART_COLORS.muted)
      .attr('rx', 2);

    // Value labels
    g.selectAll('.bar-label')
      .data(sortedData)
      .join('text')
      .attr('class', 'bar-label')
      .attr('y', (d) => (y(d.starClass) || 0) + y.bandwidth() / 2)
      .attr('x', (d) => x(d.avgScore) + 5)
      .attr('dy', '0.35em')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', '11px')
      .text((d) => `${d.avgScore.toFixed(1)} (${d.count.toLocaleString()})`);

    // Y Axis (star classes)
    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('fill', CHART_COLORS.axis)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    g.selectAll('.domain, .tick line').attr('stroke', CHART_COLORS.axis);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('fill', CHART_COLORS.axis)
      .attr('font-size', '11px');

    // Axis label
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', '12px')
      .text(t('pages.habitability.charts.axes.avgHabitabilityScore'));
  }, [data, width, height, t]);

  return <svg ref={svgRef} width={width} height={height} />;
}
