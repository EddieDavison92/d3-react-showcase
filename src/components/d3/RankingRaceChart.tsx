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
  metadata: any;
  years: string[];
  categories: Category[];
}

interface RankingRaceChartProps {
  data: TechTrendsData;
  categoryName: string;
  width?: number;
  height?: number;
}

const RankingRaceChart: React.FC<RankingRaceChartProps> = ({
  data,
  categoryName,
  width = 1000,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [highlightedTech, setHighlightedTech] = useState<string | null>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const category = data.categories.find(c => c.name === categoryName);
    if (!category) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 200, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add gradient background
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', `bg-gradient-${categoryName.replace(/\s+/g, '-')}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f3f4f6')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#e5e7eb')
      .attr('stop-opacity', 0.1);

    g.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', `url(#bg-gradient-${categoryName.replace(/\s+/g, '-')})`)
      .attr('rx', 8);

    // Scales
    const xScale = d3.scalePoint()
      .domain(data.years)
      .range([40, chartWidth - 40])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(category.technologies.flatMap(t => t.values)) || 100])
      .range([chartHeight - 20, 20])
      .nice();

    // Color scale with more vibrant colors
    const colorScale = d3.scaleOrdinal()
      .domain(category.technologies.map(t => t.name))
      .range([
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
        '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb923c',
        '#fbbf24', '#a3e635', '#4ade80', '#2dd4bf', '#22d3ee',
        '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9'
      ]);

    // Grid lines
    const yAxis = d3.axisLeft(yScale).ticks(6).tickSize(-chartWidth + 80);
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', 'translate(40, 0)')
      .call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#d1d5db')
        .attr('stroke-opacity', 0.3)
        .attr('stroke-dasharray', '2,2'))
      .call(g => g.selectAll('.tick text')
        .attr('x', -10)
        .attr('fill', '#6b7280')
        .attr('font-size', '11px')
        .text(d => `${d}%`));

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight - 20})`)
      .call(d3.axisBottom(xScale))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').remove())
      .call(g => g.selectAll('.tick text')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', '#374151'));

    // Line generator with curve
    const line = d3.line<number>()
      .x((d, i) => xScale(data.years[i]) || 0)
      .y(d => yScale(d))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Area generator for highlight effect
    const area = d3.area<number>()
      .x((d, i) => xScale(data.years[i]) || 0)
      .y0(chartHeight - 20)
      .y1(d => yScale(d))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Sort technologies by final value
    const sortedTechs = [...category.technologies].sort((a, b) =>
      b.values[b.values.length - 1] - a.values[a.values.length - 1]
    );

    // Draw area fills (background)
    sortedTechs.forEach(tech => {
      g.append('path')
        .datum(tech.values)
        .attr('class', `area-${tech.name.replace(/\s+/g, '-')}`)
        .attr('d', area)
        .attr('fill', colorScale(tech.name) as string)
        .attr('opacity', 0)
        .style('pointer-events', 'none');
    });

    // Draw lines
    sortedTechs.forEach(tech => {
      const path = g.append('path')
        .datum(tech.values)
        .attr('class', `line-${tech.name.replace(/\s+/g, '-')}`)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', colorScale(tech.name) as string)
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.7)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          setHighlightedTech(tech.name);

          // Fade all lines
          g.selectAll('path[class^="line-"]')
            .attr('opacity', 0.15)
            .attr('stroke-width', 2);

          // Highlight this line
          d3.select(this)
            .attr('opacity', 1)
            .attr('stroke-width', 4);

          // Show area
          g.select(`.area-${tech.name.replace(/\s+/g, '-')}`)
            .attr('opacity', 0.2);

          // Highlight points
          g.selectAll(`.point-${tech.name.replace(/\s+/g, '-')}`)
            .attr('r', 6);
        })
        .on('mouseout', function() {
          setHighlightedTech(null);

          // Restore all lines
          g.selectAll('path[class^="line-"]')
            .attr('opacity', 0.7)
            .attr('stroke-width', 2.5);

          // Hide area
          g.selectAll('path[class^="area-"]')
            .attr('opacity', 0);

          // Restore points
          g.selectAll('circle')
            .attr('r', 4);
        });
    });

    // Draw points
    sortedTechs.forEach(tech => {
      tech.values.forEach((value, i) => {
        g.append('circle')
          .attr('class', `point-${tech.name.replace(/\s+/g, '-')}`)
          .attr('cx', xScale(data.years[i]) || 0)
          .attr('cy', yScale(value))
          .attr('r', 4)
          .attr('fill', colorScale(tech.name) as string)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
          .style('cursor', 'pointer')
          .on('mouseover', function() {
            setHighlightedTech(`${tech.name} - ${data.years[i]}: ${value}%`);
            d3.select(this).attr('r', 6);
          })
          .on('mouseout', function() {
            setHighlightedTech(null);
            d3.select(this).attr('r', 4);
          });
      });
    });

    // End labels
    const topN = 10;
    sortedTechs.slice(0, topN).forEach((tech, i) => {
      const lastValue = tech.values[tech.values.length - 1];
      const labelG = g.append('g')
        .attr('transform', `translate(${chartWidth - 30}, ${yScale(lastValue)})`)
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          setHighlightedTech(tech.name);
          g.select(`.line-${tech.name.replace(/\s+/g, '-')}`)
            .attr('opacity', 1)
            .attr('stroke-width', 4);
          g.selectAll(`.point-${tech.name.replace(/\s+/g, '-')}`)
            .attr('r', 6);
        })
        .on('mouseout', function() {
          setHighlightedTech(null);
          g.select(`.line-${tech.name.replace(/\s+/g, '-')}`)
            .attr('opacity', 0.7)
            .attr('stroke-width', 2.5);
          g.selectAll(`.point-${tech.name.replace(/\s+/g, '-')}`)
            .attr('r', 4);
        });

      labelG.append('rect')
        .attr('x', -5)
        .attr('y', -12)
        .attr('width', 180)
        .attr('height', 24)
        .attr('fill', 'white')
        .attr('opacity', 0.9)
        .attr('rx', 4);

      labelG.append('circle')
        .attr('cx', 5)
        .attr('r', 6)
        .attr('fill', colorScale(tech.name) as string);

      labelG.append('text')
        .attr('x', 15)
        .attr('dy', '0.35em')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .attr('fill', '#111827')
        .text(tech.name);

      labelG.append('text')
        .attr('x', 165)
        .attr('dy', '0.35em')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .attr('fill', colorScale(tech.name) as string)
        .text(`${lastValue}%`);
    });

  }, [data, categoryName, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="w-full" />
      {highlightedTech && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-semibold text-blue-900">
            {highlightedTech}
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingRaceChart;
