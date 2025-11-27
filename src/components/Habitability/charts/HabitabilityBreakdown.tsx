/**
 * HabitabilityBreakdown
 * Donut chart showing the breakdown of habitability categories
 */

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import D3Chart, { CHART_COLORS } from './D3Chart';
import type { HabitabilityBreakdown as HabitabilityBreakdownData } from '../../../utils/habitabilityAnalytics';

interface HabitabilityBreakdownProps {
  data: HabitabilityBreakdownData[];
  title: string;
  totalPlanets: number;
}

export default function HabitabilityBreakdown({
  data,
  title,
  totalPlanets,
}: HabitabilityBreakdownProps) {
  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">{title}</h3>
      <D3Chart aspectRatio={1.3} minHeight={300}>
        {({ width, height }) => (
          <HabitabilityBreakdownSVG
            data={data}
            width={width}
            height={height}
            totalPlanets={totalPlanets}
          />
        )}
      </D3Chart>
      <div className="chart-legend horizontal">
        {data.map((d) => (
          <div key={d.category} className="legend-item">
            <span className="legend-dot" style={{ background: d.color }} />
            <span>
              {d.category} ({d.count.toLocaleString()})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HabitabilityBreakdownSVGProps {
  data: HabitabilityBreakdownData[];
  width: number;
  height: number;
  totalPlanets: number;
}

function HabitabilityBreakdownSVG({
  data,
  width,
  height,
  totalPlanets,
}: HabitabilityBreakdownSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.55;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Pie generator
    const pie = d3
      .pie<HabitabilityBreakdownData>()
      .value((d) => d.count)
      .sort(null);

    // Arc generator
    const arc = d3
      .arc<d3.PieArcDatum<HabitabilityBreakdownData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // Hover arc (slightly larger)
    const arcHover = d3
      .arc<d3.PieArcDatum<HabitabilityBreakdownData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 8);

    // Draw arcs
    g.selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('d', arc as unknown as string)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).attr('d', arcHover(d) as string);

        // Show tooltip
        tooltip
          .style('opacity', 1)
          .html(
            `<strong>${d.data.category}</strong><br/>` +
              `${d.data.count.toLocaleString()} planets<br/>` +
              `${d.data.pct.toFixed(2)}%`
          )
          .style('left', `${event.offsetX + 10}px`)
          .style('top', `${event.offsetY - 10}px`);
      })
      .on('mouseout', function (_, d) {
        d3.select(this).transition().duration(200).attr('d', arc(d) as string);
        tooltip.style('opacity', 0);
      });

    // Center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', CHART_COLORS.text)
      .attr('font-size', 14)
      .attr('dy', -10)
      .text('Total');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', CHART_COLORS.primary)
      .attr('font-size', 24)
      .attr('font-weight', 'bold')
      .attr('dy', 15)
      .text(totalPlanets.toLocaleString());

    // Tooltip
    const tooltip = d3
      .select(svgRef.current.parentNode as HTMLElement)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.9)')
      .style('border', '1px solid #333')
      .style('border-radius', '4px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('color', '#fff')
      .style('pointer-events', 'none')
      .style('z-index', '10');

    return () => {
      tooltip.remove();
    };
  }, [data, width, height, totalPlanets]);

  return <svg ref={svgRef} width={width} height={height} />;
}
