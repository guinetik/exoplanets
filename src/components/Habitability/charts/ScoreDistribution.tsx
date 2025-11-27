/**
 * ScoreDistribution
 * Histogram showing distribution of habitability scores
 */

import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as d3 from 'd3';
import D3Chart, { CHART_MARGINS, CHART_COLORS } from './D3Chart';
import type { ScoreDistribution as ScoreData } from '../../../utils/habitabilityAnalytics';

interface ScoreDistributionProps {
  data: ScoreData[];
}

export default function ScoreDistribution({ data }: ScoreDistributionProps) {
  const { t } = useTranslation();

  // Calculate percentage above 60
  const above60 = data
    .filter(d => d.min >= 60)
    .reduce((sum, d) => sum + d.pct, 0);

  return (
    <div className="insight-card">
      <h3 className="card-title">
        {t('pages.habitability.insights.scoreDistribution.title')}
      </h3>
      <p className="card-description">
        {t('pages.habitability.insights.scoreDistribution.description', {
          pct: above60.toFixed(1)
        })}
      </p>
      <D3Chart aspectRatio={2}>
        {(dimensions) => (
          <ScoreHistogram data={data} {...dimensions} />
        )}
      </D3Chart>
    </div>
  );
}

interface ScoreHistogramProps {
  data: ScoreData[];
  width: number;
  height: number;
}

function ScoreHistogram({ data, width, height }: ScoreHistogramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

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

    // Scales
    const x = d3.scaleBand()
      .domain(data.map(d => d.range))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.pct) || 100])
      .nice()
      .range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', CHART_COLORS.grid)
      .attr('stroke-opacity', 0.5);

    g.selectAll('.grid .domain').remove();

    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.range) || 0)
      .attr('y', d => y(d.pct))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.pct))
      .attr('fill', d => d.min >= 60 ? CHART_COLORS.secondary : CHART_COLORS.primary)
      .attr('rx', 2);

    // Value labels on bars
    g.selectAll('.bar-label')
      .data(data)
      .join('text')
      .attr('class', 'bar-label')
      .attr('x', d => (x(d.range) || 0) + x.bandwidth() / 2)
      .attr('y', d => y(d.pct) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', '11px')
      .text(d => `${d.pct.toFixed(1)}%`);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('fill', CHART_COLORS.axis)
      .attr('font-size', '11px');

    g.selectAll('.domain, .tick line')
      .attr('stroke', CHART_COLORS.axis);

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll('text')
      .attr('fill', CHART_COLORS.axis)
      .attr('font-size', '11px');

    // Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', '12px')
      .text('% of planets');

  }, [data, width, height]);

  return <svg ref={svgRef} width={width} height={height} />;
}
