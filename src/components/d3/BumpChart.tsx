"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';

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

type ViewMode = 'rank' | 'value';

interface BumpChartProps {
  data: TechTrendsData;
  categoryName: string;
  width?: number;
  height?: number;
  topN?: number;
}

const BumpChart: React.FC<BumpChartProps> = ({
  data,
  categoryName,
  width = 1200,
  height = 700,
  topN = 12,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('rank');
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const category = data.categories.find(c => c.name === categoryName);
    if (!category) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 250, bottom: 60, left: 250 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate rankings for each year
    const rankings = data.years.map((year, yearIdx) => {
      const ranked = category.technologies
        .map(tech => ({ name: tech.name, value: tech.values[yearIdx] }))
        .sort((a, b) => b.value - a.value);
      return ranked;
    });

    // Get top N technologies based on best ranking across all years
    const techBestRanks = new Map<string, number>();
    rankings.forEach(yearRanking => {
      yearRanking.forEach((tech, rank) => {
        const currentBest = techBestRanks.get(tech.name) ?? Infinity;
        techBestRanks.set(tech.name, Math.min(currentBest, rank));
      });
    });

    const topTechs = Array.from(techBestRanks.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, topN)
      .map(([name]) => name);

    // Filter to only top technologies
    const filteredRankings = rankings.map(yearRanking =>
      yearRanking.filter(tech => topTechs.includes(tech.name))
    );

    // Scales
    const xScale = d3.scalePoint()
      .domain(data.years)
      .range([0, chartWidth])
      .padding(0.5);

    // Calculate max value for value mode
    const maxValue = d3.max(category.technologies.flatMap(t => t.values)) || 100;

    // Y scales for both modes
    const yScaleRank = d3.scaleLinear()
      .domain([0, topN - 1])
      .range([0, chartHeight]);

    const yScaleValue = d3.scaleLinear()
      .domain([0, maxValue])
      .range([chartHeight, 0])
      .nice();

    const yScale = viewMode === 'rank' ? yScaleRank : yScaleValue;

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(topTechs)
      .range([
        '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
        '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef',
        '#ec4899', '#f43f5e'
      ]);

    // Get CSS colors from theme
    const styles = getComputedStyle(document.documentElement);
    const foregroundColor = `hsl(${styles.getPropertyValue('--foreground')})`;
    const mutedColor = `hsl(${styles.getPropertyValue('--muted')})`;
    const mutedForegroundColor = `hsl(${styles.getPropertyValue('--muted-foreground')})`;

    // Draw year columns
    data.years.forEach((year, i) => {
      const x = xScale(year) || 0;

      // Column background
      g.append('rect')
        .attr('x', x - 40)
        .attr('y', -20)
        .attr('width', 80)
        .attr('height', chartHeight + 40)
        .attr('fill', mutedColor)
        .attr('opacity', i % 2 === 0 ? 0.3 : 0.1);

      // Year label at top
      g.append('text')
        .attr('x', x)
        .attr('y', -30)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('fill', foregroundColor)
        .text(year);
    });

    // Draw rank labels on left - only for technologies that exist and only in rank mode
    if (viewMode === 'rank') {
      filteredRankings[0].forEach((tech, rank) => {
        if (!topTechs.includes(tech.name)) return;
        g.append('text')
          .attr('class', 'rank-left')
          .attr('x', -60 - 190 - 30) // Position further left to avoid entity labels (which are at translate(-60) with bg at x:-190)
          .attr('y', yScale(rank))
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', mutedForegroundColor)
          .attr('opacity', 1) // Always visible
          .text(`#${rank + 1}`);
      });

      // Draw rank labels on right - only for technologies that exist and only in rank mode
      const lastYearIdx = filteredRankings.length - 1;
      filteredRankings[lastYearIdx].forEach((tech, rank) => {
        if (!topTechs.includes(tech.name)) return;
        g.append('text')
          .attr('class', 'rank-right')
          .attr('x', chartWidth + 30 + 185 + 15)
          .attr('y', yScale(rank))
          .attr('dy', '0.35em')
          .attr('text-anchor', 'start')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', mutedForegroundColor)
          .text(`#${rank + 1}`);
      });
    }
    
    // Value mode: show Y-axis with percentage scale
    if (viewMode === 'value') {
      // Position Y-axis slightly to the right to leave space for entity labels
      const yAxisOffset = 0; // Keep axis at x=0, entity labels are further left
      g.append('g')
        .attr('class', 'y-axis-value')
        .attr('transform', `translate(${yAxisOffset}, 0)`)
        .call(d3.axisLeft(yScaleValue).ticks(8).tickFormat(d => `${d}%`))
        .style('font-size', '12px');

      // No Y-axis label - cleaner look without it
    }

    // Prepare line data
    const lineData = topTechs.map(techName => {
      const tech = category.technologies.find(t => t.name === techName);
      if (!tech) return { name: techName, points: [] };
      
      const points = data.years.map((year, yearIdx) => {
        const value = tech.values[yearIdx] || 0;
        const yearRanking = filteredRankings[yearIdx];
        const techData = yearRanking.find(t => t.name === techName);
        const rank = techData ? yearRanking.indexOf(techData) : topN;
        
        return {
          year,
          rank,
          value,
        };
      });
      return { name: techName, points };
    });

    // Line generator
    const line = d3.line<{ year: string; rank: number; value: number }>()
      .x(d => xScale(d.year) || 0)
      .y(d => viewMode === 'rank' ? yScale(d.rank) : yScale(d.value))
      .curve(d3.curveBumpX);

    // Draw lines with transitions
    const lines = g.selectAll<SVGGElement, typeof lineData[0]>('.bump-line')
      .data(lineData, d => d.name);

    const linesEnter = lines.enter()
      .append('g')
      .attr('class', 'bump-line');

    const linesUpdate = linesEnter.merge(lines as any);

    const paths = linesUpdate.selectAll<SVGPathElement, typeof lineData[0]>('path')
      .data(d => [d], d => d.name);

    const pathsEnter = paths.enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.name) as string)
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        setHoveredTech(d.name);
      })
      .on('mouseout', function() {
        setHoveredTech(null);
      })
      // Set initial path data immediately for new paths (no transition on enter)
      .attr('d', d => line(d.points))
      .attr('opacity', 0.8);

    // Only transition existing paths (update selection)
    paths.filter(function() {
      // Only transition paths that already have a 'd' attribute
      return d3.select(this).attr('d') !== null && d3.select(this).attr('d') !== '';
    })
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .attr('d', d => line(d.points))
      .attr('opacity', 0.8);

    lines.exit().remove();

    // Draw circles at each point with transitions
    const circles = g.selectAll<SVGCircleElement, { tech: typeof lineData[0]; point: typeof lineData[0]['points'][0] }>('.data-point')
      .data(
        lineData.flatMap(tech => tech.points.map(point => ({ 
          tech, 
          point
        }))),
        d => `${d.tech.name}-${d.point.year}`
      );

    const circlesEnter = circles.enter()
      .append('circle')
      .attr('class', 'data-point')
      .each(function() {
        // Interrupt any transitions immediately when creating
        d3.select(this).interrupt();
      })
      .attr('fill', d => colorScale(d.tech.name) as string)
      .attr('stroke', 'white')
      .attr('stroke-width', 2.5)
      .attr('r', 5)
      .attr('opacity', 1)
      // Set position immediately when creating - in the same chain
      .attr('cx', d => xScale(d.point.year) || 0)
      .attr('cy', d => viewMode === 'rank' ? yScale(d.point.rank) : yScale(d.point.value))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        setHoveredTech(d.tech.name);
        d3.select(this).attr('r', 7);
      })
      .on('mouseout', function(event, d) {
        setHoveredTech(null);
        d3.select(this).attr('r', 5);
      })
      .append('title')
      .text(d => `${d.tech.name}\n${d.point.year}: ${viewMode === 'rank' ? `#${d.point.rank + 1}` : ''} (${d.point.value}%)`);

    // Update tooltip text for all circles
    circlesEnter.merge(circles as any).select('title')
      .text(d => {
        const rankText = viewMode === 'rank' ? `#${d.point.rank + 1} ` : '';
        return `${d.tech.name}\n${d.point.year}: ${rankText}(${d.point.value}%)`;
      });

    circles.exit()
      .remove();

    // Labels on the left (first year) with transitions
    const leftLabels = g.selectAll<SVGGElement, { tech: typeof filteredRankings[0][0]; rank: number }>('.left-label')
      .data(
        filteredRankings[0]
          .map((tech, rank) => ({ tech, rank }))
          .filter(d => topTechs.includes(d.tech.name)),
        d => d.tech.name
      );

    const leftLabelsEnter = leftLabels.enter()
      .append('g')
      .attr('class', 'left-label')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        setHoveredTech(d.tech.name);
      })
      .on('mouseout', () => {
        setHoveredTech(null);
      });

    leftLabelsEnter.append('rect')
      .attr('class', 'label-bg')
      .attr('x', -190)
      .attr('y', -14)
      .attr('width', 185)
      .attr('height', 28)
      .attr('fill', 'white')
      .attr('rx', 6)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('opacity', 1);

    leftLabelsEnter.append('text')
      .attr('class', 'label-name')
      .attr('x', -175)
      .attr('dy', '0.35em')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .attr('fill', foregroundColor);

    leftLabelsEnter.append('text')
      .attr('class', 'label-value')
      .attr('x', -10)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    // Set initial position immediately for new labels (no transition)
    leftLabelsEnter
      .attr('transform', d => {
        const y = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        return `translate(-60, ${y})`;
      });

    const leftLabelsUpdate = leftLabelsEnter.merge(leftLabels as any);
    
    // Transition existing labels smoothly from their current position to new position
    leftLabels
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .attrTween('transform', function(d) {
        // Get current Y position from existing transform
        const current = d3.select(this).attr('transform');
        let currentY: number;
        if (current) {
          const match = current.match(/translate\([^,]+,\s*([^)]+)\)/);
          currentY = match ? parseFloat(match[1]) : (viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value));
        } else {
          currentY = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        }
        
        // Calculate target Y position
        const targetY = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        
        // Interpolate between current and target
        const interpolate = d3.interpolateNumber(currentY, targetY);
        return (t: number) => `translate(-60, ${interpolate(t)})`;
      });

    leftLabelsUpdate.select('.label-name')
      .text(d => d.tech.name);

    leftLabelsUpdate.select('.label-value')
      .attr('fill', d => colorScale(d.tech.name) as string)
      .text(d => `${d.tech.value}%`);

    leftLabels.exit()
      .remove();

    // Labels on the right (last year) with transitions
    const lastYearIdx = filteredRankings.length - 1;
    type TechType = { name: string; value: number };
    const rightLabels = g.selectAll<SVGGElement, { tech: TechType; rank: number }>('.right-label')
      .data(
        filteredRankings[lastYearIdx]
          .map((tech, rank) => ({ tech, rank }))
          .filter(d => topTechs.includes(d.tech.name)),
        d => d.tech.name
      );

    const rightLabelsEnter = rightLabels.enter()
      .append('g')
      .attr('class', 'right-label')
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        setHoveredTech(d.tech.name);
      })
      .on('mouseout', () => {
        setHoveredTech(null);
      });

    rightLabelsEnter.append('rect')
      .attr('class', 'label-bg')
      .attr('x', 5)
      .attr('y', -14)
      .attr('width', 185)
      .attr('height', 28)
      .attr('fill', 'white')
      .attr('rx', 6)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('opacity', 1);

    rightLabelsEnter.append('circle')
      .attr('cx', 15)
      .attr('r', 6);

    rightLabelsEnter.append('text')
      .attr('class', 'label-name')
      .attr('x', 25)
      .attr('dy', '0.35em')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .attr('fill', foregroundColor);

    rightLabelsEnter.append('text')
      .attr('class', 'label-value')
      .attr('x', 180)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    // Set initial position immediately for new labels (no transition)
    rightLabelsEnter
      .attr('transform', d => {
        const y = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        return `translate(${chartWidth + 30}, ${y})`;
      });

    const rightLabelsUpdate = rightLabelsEnter.merge(rightLabels as any);
    
    // Transition existing labels smoothly from their current position to new position
    rightLabels
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .attrTween('transform', function(d) {
        // Get current Y position from existing transform
        const current = d3.select(this).attr('transform');
        let currentY: number;
        if (current) {
          const match = current.match(/translate\([^,]+,\s*([^)]+)\)/);
          currentY = match ? parseFloat(match[1]) : (viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value));
        } else {
          currentY = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        }
        
        // Calculate target Y position
        const targetY = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        
        // Interpolate between current and target
        const interpolate = d3.interpolateNumber(currentY, targetY);
        return (t: number) => `translate(${chartWidth + 30}, ${interpolate(t)})`;
      });

    rightLabelsUpdate.select('circle')
      .attr('fill', d => colorScale(d.tech.name) as string);

    rightLabelsUpdate.select('.label-name')
      .text(d => d.tech.name);

    rightLabelsUpdate.select('.label-value')
      .attr('fill', d => colorScale(d.tech.name) as string)
      .text(d => `${d.tech.value}%`);

    rightLabels.exit()
      .remove();

    // Mark that initial render is complete
    isInitialRender.current = false;
  }, [data, categoryName, width, height, topN]);

  // Separate effect for view mode transitions - only animates positions, doesn't re-render
  useEffect(() => {
    // Don't run transitions on initial render
    if (isInitialRender.current) return;
    
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    
    // Check if chart has been rendered
    if (g.selectAll('.bump-line').empty()) return;

    const category = data.categories.find(c => c.name === categoryName);
    if (!category) return;

    const margin = { top: 60, right: 250, bottom: 60, left: 250 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Recalculate scales for current view mode
    const maxValue = d3.max(category.technologies.flatMap(t => t.values)) || 100;
    const yScaleRank = d3.scaleLinear()
      .domain([0, topN - 1])
      .range([0, chartHeight]);
    const yScaleValue = d3.scaleLinear()
      .domain([0, maxValue])
      .range([chartHeight, 0])
      .nice();
    const yScale = viewMode === 'rank' ? yScaleRank : yScaleValue;

    const xScale = d3.scalePoint()
      .domain(data.years)
      .range([0, chartWidth])
      .padding(0.5);

    // Calculate rankings for line data
    const rankings = data.years.map((year, yearIdx) => {
      const ranked = category.technologies
        .map(tech => ({ name: tech.name, value: tech.values[yearIdx] }))
        .sort((a, b) => b.value - a.value);
      return ranked;
    });

    const techBestRanks = new Map<string, number>();
    rankings.forEach(yearRanking => {
      yearRanking.forEach((tech, rank) => {
        const currentBest = techBestRanks.get(tech.name) ?? Infinity;
        techBestRanks.set(tech.name, Math.min(currentBest, rank));
      });
    });

    const topTechs = Array.from(techBestRanks.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, topN)
      .map(([name]) => name);

    const filteredRankings = rankings.map(yearRanking =>
      yearRanking.filter(tech => topTechs.includes(tech.name))
    );

    // Update line paths
    const lineData = topTechs.map(techName => {
      const tech = category.technologies.find(t => t.name === techName);
      if (!tech) return { name: techName, points: [] };
      
      const points = data.years.map((year, yearIdx) => {
        const value = tech.values[yearIdx] || 0;
        const yearRanking = filteredRankings[yearIdx];
        const techData = yearRanking.find(t => t.name === techName);
        const rank = techData ? yearRanking.indexOf(techData) : topN;
        
        return {
          year,
          rank,
          value,
        };
      });
      return { name: techName, points };
    });

    const line = d3.line<{ year: string; rank: number; value: number }>()
      .x(d => xScale(d.year) || 0)
      .y(d => viewMode === 'rank' ? yScale(d.rank) : yScale(d.value))
      .curve(d3.curveBumpX);

    // Transition lines
    g.selectAll('.bump-line path')
      .data(lineData, (d: any) => d.name)
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .attr('d', (d: any) => line(d.points));

    // Transition circles - ensure they're visible markers on the lines
    // Only transition circles that already exist (not newly created ones)
    g.selectAll('.data-point')
      .filter(function() {
        // Only transition circles that already have a cy position (exist in DOM)
        const cy = d3.select(this).attr('cy');
        return cy !== null && cy !== '';
      })
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .attr('cx', function() {
        const d = d3.select(this).datum() as any;
        if (!d || !d.point) return 0;
        return xScale(d.point.year) || 0;
      })
      .attr('cy', function() {
        const d = d3.select(this).datum() as any;
        if (!d || !d.point) return 0;
        return viewMode === 'rank' ? yScale(d.point.rank) : yScale(d.point.value);
      });

    // Transition left labels
    g.selectAll('.left-label')
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .attrTween('transform', function(d: any) {
        const current = d3.select(this).attr('transform');
        let currentY: number;
        if (current) {
          const match = current.match(/translate\([^,]+,\s*([^)]+)\)/);
          currentY = match ? parseFloat(match[1]) : (viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value));
        } else {
          currentY = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        }
        
        const targetY = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        const interpolate = d3.interpolateNumber(currentY, targetY);
        return (t: number) => `translate(-60, ${interpolate(t)})`;
      });

    // Transition right labels
    g.selectAll('.right-label')
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .attrTween('transform', function(d: any) {
        const current = d3.select(this).attr('transform');
        let currentY: number;
        if (current) {
          const match = current.match(/translate\([^,]+,\s*([^)]+)\)/);
          currentY = match ? parseFloat(match[1]) : (viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value));
        } else {
          currentY = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        }
        
        const targetY = viewMode === 'rank' ? yScale(d.rank) : yScale(d.tech.value);
        const interpolate = d3.interpolateNumber(currentY, targetY);
        return (t: number) => `translate(${chartWidth + 30}, ${interpolate(t)})`;
      });

    // Update Y-axis and rank labels based on view mode
    if (viewMode === 'value') {
      // Hide rank labels in value mode
      g.selectAll('.rank-left, .rank-right')
        .transition()
        .duration(750)
        .attr('opacity', 0)
        .remove();
      
      // Show Y-axis for value mode
      g.selectAll('.y-axis-value').remove();
      g.selectAll('.y-axis-label').remove();
      
      const yAxisOffset = 0;
      g.append('g')
        .attr('class', 'y-axis-value')
        .attr('transform', `translate(${yAxisOffset}, 0)`)
        .call(d3.axisLeft(yScaleValue).ticks(8).tickFormat(d => `${d}%`))
        .style('font-size', '12px');
      
      // No Y-axis label - cleaner look without it
    } else {
      // Show rank labels in rank mode
      const filteredRankings = rankings.map(yearRanking =>
        yearRanking.filter(tech => topTechs.includes(tech.name))
      );
      
      // Get theme colors
      const styles = getComputedStyle(document.documentElement);
      const mutedForegroundColor = `hsl(${styles.getPropertyValue('--muted-foreground')})`;

      // Remove existing rank labels first
      g.selectAll('.rank-left, .rank-right').remove();

      // Add left rank labels
      filteredRankings[0].forEach((tech, rank) => {
        if (!topTechs.includes(tech.name)) return;
        g.append('text')
          .attr('class', 'rank-left')
          .attr('x', -60 - 190 - 30) // Position further left to avoid entity labels (which are at translate(-60) with bg at x:-190)
          .attr('y', yScale(rank))
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', mutedForegroundColor)
          .attr('opacity', 1) // Always visible
          .text(`#${rank + 1}`);
      });

      // Add right rank labels
      const lastYearIdx = filteredRankings.length - 1;
      filteredRankings[lastYearIdx].forEach((tech, rank) => {
        if (!topTechs.includes(tech.name)) return;
        g.append('text')
          .attr('class', 'rank-right')
          .attr('x', chartWidth + 30 + 185 + 15)
          .attr('y', yScale(rank))
          .attr('dy', '0.35em')
          .attr('text-anchor', 'start')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', mutedForegroundColor)
          .text(`#${rank + 1}`);
      });
      
      // Hide Y-axis in rank mode
      g.selectAll('.y-axis-value').remove();
      g.selectAll('.y-axis-label').remove();
    }

  }, [viewMode, data, categoryName, width, height, topN]);

  // Separate effect for hover state updates (no re-render, no transitions)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    
    // Check if elements exist (chart has been rendered)
    if (g.selectAll('.bump-line').empty()) return;

    // Update line opacity (no transition for hover - instant update)
    g.selectAll('.bump-line path')
      .attr('opacity', function() {
        const d = d3.select(this).datum() as { name: string };
        return hoveredTech === null || hoveredTech === d.name ? 0.8 : 0.15;
      });

    // Update circle opacity and size (no transition for hover - instant update)
    g.selectAll('.data-point')
      .attr('r', function() {
        const d = d3.select(this).datum() as { tech: { name: string } };
        return hoveredTech === d.tech.name ? 7 : 5;
      })
      .attr('opacity', function() {
        const d = d3.select(this).datum() as { tech: { name: string } };
        return hoveredTech === null || hoveredTech === d.tech.name ? 1 : 0.3;
      });

    // Update label opacity, stroke, and z-order (no transition for hover - instant update)
    g.selectAll('.left-label, .right-label').each(function() {
      const labelG = d3.select(this);
      const d = labelG.datum() as { tech: { name: string } };
      const isHovered = hoveredTech === d.tech.name;
      // Get color from the line path instead of circle
      const linePath = g.selectAll('.bump-line path').filter(function() {
        return (d3.select(this).datum() as any)?.name === d.tech.name;
      });
      const color = linePath.attr('stroke') || '#e5e7eb';
      
      // Move hovered labels to front (higher z-index via DOM order)
      if (isHovered) {
        labelG.raise();
      }
      
      // Ensure background exists and is styled properly
      let bg = labelG.select<SVGRectElement>('.label-bg');
      if (bg.empty()) {
        // Create background if it doesn't exist (shouldn't happen, but safety check)
        bg = labelG.insert<SVGRectElement>('rect', ':first-child')
          .attr('class', 'label-bg');
        if (labelG.classed('left-label')) {
          bg.attr('x', -190)
            .attr('y', -14)
            .attr('width', 185)
            .attr('height', 28)
            .attr('rx', 6);
        } else {
          bg.attr('x', 5)
            .attr('y', -14)
            .attr('width', 185)
            .attr('height', 28)
            .attr('rx', 6);
        }
      }
      
      // Get theme colors for background
      const styles = getComputedStyle(document.documentElement);
      const cardColor = `hsl(${styles.getPropertyValue('--card')})`;

      bg.attr('stroke', isHovered ? color : '#e5e7eb')
        .attr('stroke-width', isHovered ? 2 : 1)
        .attr('opacity', hoveredTech === null || isHovered ? 1 : 0.3)
        .attr('fill', isHovered ? cardColor : 'white')
        .style('filter', isHovered ? `drop-shadow(0 2px 8px ${color}40)` : 'none'); // Add glow when hovered
    });
  }, [hoveredTech]);

  return (
    <div className="relative">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">View:</span>
        <Button
          variant={viewMode === 'rank' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('rank')}
        >
          Rank Changes
        </Button>
        <Button
          variant={viewMode === 'value' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('value')}
        >
          Adoption %
        </Button>
      </div>
      <svg ref={svgRef} className="w-full" />
      {hoveredTech && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-sm">
          <div className="text-lg font-bold text-blue-900">
            {hoveredTech}
          </div>
          <div className="text-sm text-blue-700 mt-1">
            Hover over points to see detailed {viewMode === 'rank' ? 'ranking' : 'percentage'} and percentage for each year
          </div>
        </div>
      )}
    </div>
  );
};

export default BumpChart;
