/**
 * DiscoveryTimeline
 * Area chart showing discovery trends over time
 */

import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import D3Chart, { CHART_MARGINS, CHART_COLORS } from './D3Chart';
import type { DiscoveryTrend } from '../../../utils/habitabilityAnalytics';

interface DiscoveryTimelineProps {
  data: DiscoveryTrend[];
}

// Mission launch years
const KEPLER_LAUNCH = 2009;
const TESS_LAUNCH = 2018;

export default function DiscoveryTimeline({ data }: DiscoveryTimelineProps) {
  const { t } = useTranslation();

  return (
    <div className="insight-card">
      <h3 className="card-title">
        {t('pages.habitability.insights.discovery.title')}
      </h3>
      <p className="card-description">
        {t('pages.habitability.insights.discovery.description')}
      </p>
      <D3Chart aspectRatio={2}>
        {(dimensions) => <TimelineArea data={data} {...dimensions} />}
      </D3Chart>
    </div>
  );
}

interface TimelineAreaProps {
  data: DiscoveryTrend[];
  width: number;
  height: number;
}

function TimelineArea({ data, width, height }: TimelineAreaProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!svgRef.current || width === 0 || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = CHART_MARGINS;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter to reasonable date range
    const filteredData = data.filter((d) => d.year >= 1995);

    // Scales
    const x = d3
      .scaleLinear()
      .domain([
        d3.min(filteredData, (d) => d.year) || 1995,
        d3.max(filteredData, (d) => d.year) || 2024,
      ])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.cumulative) || 1000])
      .nice()
      .range([innerHeight, 0]);

    // Area generator for total discoveries
    const areaTotal = d3
      .area<DiscoveryTrend>()
      .x((d) => x(d.year))
      .y0(innerHeight)
      .y1((d) => y(d.cumulative))
      .curve(d3.curveMonotoneX);

    // Area generator for habitable discoveries
    const areaHabitable = d3
      .area<DiscoveryTrend>()
      .x((d) => x(d.year))
      .y0(innerHeight)
      .y1((d) => y(d.cumulativeHabitable))
      .curve(d3.curveMonotoneX);

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

    // Total discoveries area
    g.append('path')
      .datum(filteredData)
      .attr('fill', CHART_COLORS.primary)
      .attr('fill-opacity', 0.3)
      .attr('d', areaTotal);

    // Habitable discoveries area
    g.append('path')
      .datum(filteredData)
      .attr('fill', CHART_COLORS.secondary)
      .attr('fill-opacity', 0.5)
      .attr('d', areaHabitable);

    // Total line
    const lineTotal = d3
      .line<DiscoveryTrend>()
      .x((d) => x(d.year))
      .y((d) => y(d.cumulative))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', CHART_COLORS.primary)
      .attr('stroke-width', 2)
      .attr('d', lineTotal);

    // Habitable line
    const lineHabitable = d3
      .line<DiscoveryTrend>()
      .x((d) => x(d.year))
      .y((d) => y(d.cumulativeHabitable))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', CHART_COLORS.secondary)
      .attr('stroke-width', 2)
      .attr('d', lineHabitable);

    // Mission launch markers
    const missions = [
      {
        year: KEPLER_LAUNCH,
        label: t('pages.habitability.insights.discovery.kepler'),
      },
      {
        year: TESS_LAUNCH,
        label: t('pages.habitability.insights.discovery.tess'),
      },
    ];

    missions.forEach((mission) => {
      if (mission.year >= (d3.min(filteredData, (d) => d.year) || 1995)) {
        // Vertical line
        g.append('line')
          .attr('x1', x(mission.year))
          .attr('x2', x(mission.year))
          .attr('y1', 0)
          .attr('y2', innerHeight)
          .attr('stroke', CHART_COLORS.tertiary)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.7);

        // Label
        g.append('text')
          .attr('x', x(mission.year))
          .attr('y', -5)
          .attr('text-anchor', 'middle')
          .attr('fill', CHART_COLORS.tertiary)
          .attr('font-size', '10px')
          .text(mission.label);
      }
    });

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d) => String(d))
          .ticks(6)
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

    // Legend
    const legend = g
      .append('g')
      .attr('transform', `translate(${innerWidth - 120}, 10)`);

    // Total legend
    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 15)
      .attr('height', 3)
      .attr('fill', CHART_COLORS.primary);

    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 4)
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', '10px')
      .text(t('pages.habitability.charts.legend.allDiscoveries'));

    // Habitable legend
    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', 15)
      .attr('width', 15)
      .attr('height', 3)
      .attr('fill', CHART_COLORS.secondary);

    legend
      .append('text')
      .attr('x', 20)
      .attr('y', 19)
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', '10px')
      .text(t('pages.habitability.charts.legend.habitableZone'));
  }, [data, width, height, t]);

  return <svg ref={svgRef} width={width} height={height} />;
}
