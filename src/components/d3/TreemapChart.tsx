import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface HierarchyNode {
  name: string;
  value?: number;
  children?: HierarchyNode[];
}

interface TreemapChartProps {
  data: HierarchyNode;
  width?: number;
  height?: number;
}

const TreemapChart: React.FC<TreemapChartProps> = ({
  data,
  width = 1000,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string>('');

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create hierarchy
    const root = d3.hierarchy(data)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    const treemap = d3.treemap<HierarchyNode>()
      .size([width, height])
      .padding(2)
      .round(true);

    treemap(root);

    // Create color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create cell groups
    const cell = svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Add rectangles
    cell.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => {
        let node: d3.HierarchyNode<HierarchyNode> | null = d;
        while (node && node.depth > 1) node = node.parent;
        return node ? color(node.data.name) : '#ccc';
      })
      .attr('fill-opacity', 0.7)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('fill-opacity', 1)
          .attr('stroke-width', 3);

        const path = getPath(d);
        setSelectedNode(path);

        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div class="font-bold">${d.data.name}</div>
            <div class="text-sm mt-1">
              Value: ${(d.value || 0).toLocaleString()}
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
          .attr('stroke-width', 2);

        d3.select(tooltipRef.current)
          .style('visibility', 'hidden');
      });

    // Add labels
    cell.append('text')
      .selectAll('tspan')
      .data(d => {
        const name = d.data.name;
        const value = d.value || 0;
        return [name, value.toLocaleString()];
      })
      .enter()
      .append('tspan')
      .attr('x', 4)
      .attr('y', (d, i) => 14 + i * 12)
      .attr('fill', 'white')
      .attr('font-size', (d, i) => i === 0 ? '11px' : '9px')
      .attr('font-weight', (d, i) => i === 0 ? 'bold' : 'normal')
      .attr('opacity', function(d, i, nodes) {
        const parentNode = d3.select(nodes[i].parentNode as SVGTextElement);
        const parentData = parentNode.datum() as d3.HierarchyRectangularNode<HierarchyNode>;
        const width = parentData.x1 - parentData.x0;
        const height = parentData.y1 - parentData.y0;
        return width > 60 && height > 30 ? 1 : 0;
      })
      .text(d => d);

    function getPath(d: d3.HierarchyNode<HierarchyNode>): string {
      const ancestors = d.ancestors().reverse();
      return ancestors.map(a => a.data.name).join(' > ');
    }

  }, [data, width, height]);

  return (
    <div className="relative flex flex-col items-center">
      <svg ref={svgRef} className="border border-border rounded max-w-full h-auto" />
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
        <p>💡 Hover over rectangles to see details • Size represents relative value</p>
      </div>
    </div>
  );
};

export default TreemapChart;
