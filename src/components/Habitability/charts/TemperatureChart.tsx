/**
 * TemperatureChart
 * Scatter plot showing temperature vs habitability score
 * with highlighted "goldilocks zone" (200-320K)
 */

import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import D3Chart, { CHART_MARGINS, CHART_COLORS } from './D3Chart';
import type { TemperatureScoreData } from '../../../utils/habitabilityAnalytics';

interface TemperatureChartProps {
  data: TemperatureScoreData[];
}

export default function TemperatureChart({ data }: TemperatureChartProps) {
  const { t } = useTranslation();

  return (
    <div className="insight-card">
      <h3 className="card-title">
        {t('pages.habitability.insights.temperature.title')}
      </h3>
      <p className="card-description">
        {t('pages.habitability.insights.temperature.description')}
      </p>
      <D3Chart aspectRatio={2}>
        {({ width, height }) => <TempScatter data={data} width={width} height={height} isMobile={false} />}
      </D3Chart>
    </div>
  );
}

interface TempScatterProps {
  data: TemperatureScoreData[];
  width: number;
  height: number;
  isMobile: boolean;
}

function TempScatter({ data, width, height }: TempScatterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!svgRef.current || width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = CHART_MARGINS;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Sample data for performance (max 2000 points)
    const sampledData =
      data.length > 2000
        ? data.filter((_, i) => i % Math.ceil(data.length / 2000) === 0)
        : data;

    // Scales
    const x = d3
      .scaleLog()
      .domain([50, d3.max(data, (d) => d.temp) || 3000])
      .range([0, innerWidth]);

    const y = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // Goldilocks zone (200-320K)
    const goldilocksMin = 200;
    const goldilocksMax = 320;

    g.append('rect')
      .attr('x', x(goldilocksMin))
      .attr('y', 0)
      .attr('width', x(goldilocksMax) - x(goldilocksMin))
      .attr('height', innerHeight)
      .attr('fill', CHART_COLORS.goldilocks);

    // Zone label
    g.append('text')
      .attr('x', x(Math.sqrt(goldilocksMin * goldilocksMax)))
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', CHART_COLORS.secondary)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text(t('pages.habitability.charts.goldilocksZone'));

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', CHART_COLORS.grid)
      .attr('stroke-opacity', 0.5);

    g.selectAll('.grid .domain').remove();

    // Points
    g.selectAll('.point')
      .data(sampledData)
      .join('circle')
      .attr('class', 'point')
      .attr('cx', (d) => x(d.temp))
      .attr('cy', (d) => y(d.score))
      .attr('r', (d) => (d.isHabitable ? 3 : 1.5))
      .attr('fill', (d) => {
        if (d.isHabitable && d.isEarthLike) return CHART_COLORS.secondary;
        if (d.isHabitable) return CHART_COLORS.primary;
        return CHART_COLORS.muted;
      })
      .attr('opacity', (d) => (d.isHabitable ? 0.8 : 0.3));

    // X Axis (log scale)
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues([100, 200, 500, 1000, 2000])
          .tickFormat((d) => `${d}K`)
      )
      .selectAll('text')
      .attr('fill', CHART_COLORS.axis)
      .attr('font-size', '11px');

    g.selectAll('.domain, .tick line').attr('stroke', CHART_COLORS.axis);

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('fill', CHART_COLORS.axis)
      .attr('font-size', '11px');

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', '12px')
      .text(t('pages.habitability.charts.axes.temperature'));

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', '12px')
      .text(t('pages.habitability.charts.axes.habitabilityScore'));
  }, [data, width, height, t]);

  return <svg ref={svgRef} width={width} height={height} />;
}
