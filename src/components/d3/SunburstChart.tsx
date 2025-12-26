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
  const [selectedNode, setSelectedNode] = useState<string>('');

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

    // Color function - uses depth 1 ancestor
    const getColor = (d: d3.HierarchyRectangularNode<HierarchyNode>) => {
      let node = d;
      while (node.depth > 1) node = node.parent!;
      return color(node.data.name);
    };

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
    g.selectAll('path')
      .data(root.descendants().filter(d => d.depth > 0) as d3.HierarchyRectangularNode<HierarchyNode>[])
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => getColor(d))
      .attr('fill-opacity', 0.7)
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const path = getPath(d);
        setSelectedNode(path);

        d3.select(this)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 2);

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
            <div class="text-xs mt-1">
              ${((d.value || 0) / (root.value || 1) * 100).toFixed(1)}% of total
            </div>
          `);
      })
      .on('mousemove', function(event) {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('fill-opacity', 0.7)
          .attr('stroke-width', 1);

        d3.select(tooltipRef.current)
          .style('visibility', 'hidden');
      });

    // Add labels for larger arcs
    g.selectAll('text')
      .data(root.descendants().filter(d => d.depth > 0 && (d.x1 - d.x0) > 0.1) as d3.HierarchyRectangularNode<HierarchyNode>[])
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
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', 'currentColor')
      .text(data.name);

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
      {selectedNode && (
        <div className="mt-4 p-3 bg-muted rounded-lg max-w-2xl">
          <div className="text-sm font-semibold text-muted-foreground mb-1">Selected Path:</div>
          <div className="text-sm">{selectedNode}</div>
        </div>
      )}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>💡 Hover over segments to see hierarchy path and percentage of total</p>
      </div>
    </div>
  );
};

export default SunburstChart;
