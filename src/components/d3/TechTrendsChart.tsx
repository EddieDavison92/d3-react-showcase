"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Technology {
  name: string;
  values: number[];
}

interface Category {
  name: string;
  technologies: Technology[];
}

interface TechTrendsData {
  metadata: {
    source: string;
    attribution: string;
    url: string;
    description: string;
  };
  years: string[];
  categories: Category[];
}

interface TechTrendsChartProps {
  data: TechTrendsData;
  categoryName: string;
  width?: number;
  height?: number;
}

const TechTrendsChart: React.FC<TechTrendsChartProps> = ({
  data,
  categoryName,
  width = 800,
  height = 400,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const category = data.categories.find(c => c.name === categoryName);
    if (!category) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 120, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scalePoint()
      .domain(data.years)
      .range([0, chartWidth])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(category.technologies.flatMap(t => t.values)) || 100])
      .range([chartHeight, 0])
      .nice();

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(category.technologies.map(t => t.name));

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(8).tickFormat(d => `${d}%`))
      .style('font-size', '12px');

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .attr('fill', 'currentColor')
      .text('% of Developers');

    // Line generator
    const line = d3.line<number>()
      .x((d, i) => xScale(data.years[i]) || 0)
      .y(d => yScale(d))
      .curve(d3.curveMonotoneX);

    // Draw lines
    const lines = g.selectAll('.tech-line')
      .data(category.technologies)
      .enter()
      .append('g')
      .attr('class', 'tech-line');

    lines.append('path')
      .attr('d', d => line(d.values))
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.name))
      .attr('stroke-width', 2)
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 4)
          .attr('opacity', 1);

        setSelectedTech(d.name);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('opacity', 0.7);

        setSelectedTech(null);
      });

    // Draw points
    category.technologies.forEach(tech => {
      tech.values.forEach((value, i) => {
        g.append('circle')
          .attr('cx', xScale(data.years[i]) || 0)
          .attr('cy', yScale(value))
          .attr('r', 4)
          .attr('fill', colorScale(tech.name))
          .style('cursor', 'pointer')
          .on('mouseover', function(event) {
            d3.select(this).attr('r', 6);

            const tooltip = d3.select(tooltipRef.current);
            tooltip
              .style('visibility', 'visible')
              .html(`
                <div class="font-bold">${tech.name}</div>
                <div class="text-sm mt-1">${data.years[i]}: ${value}%</div>
                ${i > 0 ? `<div class="text-xs mt-1 ${value - tech.values[i-1] >= 0 ? 'text-green-600' : 'text-red-600'}">
                  ${value - tech.values[i-1] >= 0 ? '↑' : '↓'} ${Math.abs(value - tech.values[i-1]).toFixed(1)}% from ${data.years[i-1]}
                </div>` : ''}
              `);
          })
          .on('mousemove', function(event) {
            const tooltip = d3.select(tooltipRef.current);
            tooltip
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 10}px`);
          })
          .on('mouseout', function() {
            d3.select(this).attr('r', 4);
            d3.select(tooltipRef.current).style('visibility', 'hidden');
          });
      });
    });

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth + 20}, 0)`);

    category.technologies.forEach((tech, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`)
        .style('cursor', 'pointer');

      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', colorScale(tech.name));

      legendRow.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .style('font-size', '11px')
        .attr('fill', 'currentColor')
        .text(tech.name);
    });

  }, [data, categoryName, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full" />
      <div
        ref={tooltipRef}
        className="absolute invisible bg-background text-foreground border border-border rounded-lg p-3 shadow-lg pointer-events-none z-10"
        style={{ maxWidth: '250px' }}
      />
      {selectedTech && (
        <div className="mt-2 text-sm text-muted-foreground">
          Selected: <span className="font-semibold">{selectedTech}</span>
        </div>
      )}
    </div>
  );
};

export default TechTrendsChart;
