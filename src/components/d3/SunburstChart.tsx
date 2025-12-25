import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface HierarchyNode {
  name: string;
  value?: number;
  children?: HierarchyNode[];
}

interface SunburstChartProps {
  data: HierarchyNode;
  width?: number;
  height?: number;
}

const SunburstChart: React.FC<SunburstChartProps> = ({
  data,
  width = 800,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const radius = Math.min(width, height) / 2;

    // Create hierarchy
    const root = d3.hierarchy(data)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create partition layout
    const partition = d3.partition<HierarchyNode>()
      .size([2 * Math.PI, radius]);

    partition(root);

    // Create color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create arc generator
    const arc = d3.arc<d3.HierarchyRectangularNode<HierarchyNode>>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1 - 1);

    // Create SVG container
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
      .append('g');

    // Create arcs
    const arcs = g.selectAll('path')
      .data(root.descendants().filter(d => d.depth > 0))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => {
        while (d.depth > 1) d = d.parent!;
        return color(d.data.name);
      })
      .attr('fill-opacity', d => arcOpacity(d))
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer');

    // Add interactivity
    arcs
      .on('mouseover', function(event, d) {
        const path = getPath(d);
        setSelectedPath(path);

        d3.select(this)
          .attr('fill-opacity', 1);

        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div class="font-bold">${d.data.name}</div>
            <div class="text-sm mt-1">
              ${d.value ? `Value: ${d.value.toLocaleString()}` : ''}
            </div>
            <div class="text-xs mt-1 text-muted-foreground">
              ${path}
            </div>
          `);
      })
      .on('mousemove', function(event) {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('fill-opacity', arcOpacity(d));

        d3.select(tooltipRef.current)
          .style('visibility', 'hidden');
      })
      .on('click', function(event, d) {
        event.stopPropagation();
        zoom(d);
      });

    // Add labels for larger arcs
    const labels = g.selectAll('text')
      .data(root.descendants().filter(d => d.depth > 0 && (d.x1 - d.x0) > 0.1))
      .enter()
      .append('text')
      .attr('transform', d => {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('pointer-events', 'none')
      .text(d => d.data.name);

    // Add center label
    const centerLabel = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', 'currentColor')
      .text(data.name);

    const centerSubLabel = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 25)
      .attr('font-size', '12px')
      .attr('fill', 'currentColor')
      .attr('opacity', 0.7)
      .text('Click to zoom');

    // Zoom functionality
    let currentNode = root;

    function zoom(d: d3.HierarchyRectangularNode<HierarchyNode>) {
      currentNode = d;

      const path = getPath(d);
      setSelectedPath(path);

      centerLabel.text(d.data.name);
      centerSubLabel.text(d.parent ? 'Click to zoom out' : 'Click to zoom');

      const transition = svg.transition()
        .duration(750);

      arcs
        .transition(transition as any)
        .tween('data', (node: any) => {
          const i = d3.interpolate(node.current, node);
          return (t: number) => node.current = i(t);
        })
        .attrTween('d', (node: any) => () => arc(node.current));

      labels
        .transition(transition as any)
        .attr('opacity', node => {
          return isVisible(node, d) ? 1 : 0;
        });
    }

    function isVisible(d: d3.HierarchyRectangularNode<HierarchyNode>, current: d3.HierarchyRectangularNode<HierarchyNode>): boolean {
      return d.y0 >= current.y0 && d.y1 <= current.y1 && d.x0 >= current.x0 && d.x1 <= current.x1;
    }

    // Click on center to go back
    svg.on('click', () => {
      if (currentNode.parent) {
        zoom(currentNode.parent);
      } else {
        zoom(root);
      }
    });

    function arcOpacity(d: d3.HierarchyRectangularNode<HierarchyNode>): number {
      const baseOpacity = 0.6;
      const depthFactor = 1 - (d.depth * 0.1);
      return Math.max(baseOpacity, depthFactor);
    }

    function getPath(d: d3.HierarchyRectangularNode<HierarchyNode>): string {
      const ancestors = d.ancestors().reverse();
      return ancestors.map(a => a.data.name).join(' > ');
    }

  }, [data, width, height]);

  return (
    <div className="relative flex flex-col items-center">
      <svg ref={svgRef} className="max-w-full h-auto" />
      <div
        ref={tooltipRef}
        className="absolute invisible bg-background text-foreground border border-border rounded-lg p-3 shadow-lg pointer-events-none z-10"
        style={{ maxWidth: '300px' }}
      />
      {selectedPath && (
        <div className="mt-4 p-3 bg-muted rounded-lg max-w-2xl">
          <div className="text-sm font-semibold text-muted-foreground mb-1">Current Path:</div>
          <div className="text-sm">{selectedPath}</div>
        </div>
      )}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>💡 Hover over segments for details • Click to zoom in/out • Click center to go back</p>
      </div>
    </div>
  );
};

export default SunburstChart;
