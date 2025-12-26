import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';

interface Node {
  id: string;
  category?: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface SankeyDiagramProps {
  nodes: Node[];
  links: Link[];
  width?: number;
  height?: number;
}

const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  nodes,
  links,
  width = 1400,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!nodes.length || !links.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create Sankey generator
    const sankeyGenerator = sankey<Node, Link>()
      .nodeId((d: any) => d.id)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[margin.left, margin.top], [innerWidth, innerHeight]]);

    // Process data
    const graph = sankeyGenerator({
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(d => ({ ...d }))
    });

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const g = svg.append('g');

    // Add links
    const link = g.append('g')
      .selectAll('path')
      .data(graph.links)
      .enter()
      .append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => {
        const sourceNode = d.source as any;
        return color(sourceNode.category || sourceNode.id);
      })
      .attr('stroke-width', d => Math.max(1, d.width || 0))
      .attr('fill', 'none')
      .attr('opacity', 0.4)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.7);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.4);
      });

    // Add nodes
    const node = g.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .enter()
      .append('g');

    node.append('rect')
      .attr('x', d => d.x0!)
      .attr('y', d => d.y0!)
      .attr('height', d => d.y1! - d.y0!)
      .attr('width', d => d.x1! - d.x0!)
      .attr('fill', d => color((d as any).category || d.id))
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('visibility', 'visible')
          .html(`
            <div class="font-bold">${d.id}</div>
            ${(d as any).category ? `<div class="text-sm">Category: ${(d as any).category}</div>` : ''}
            <div class="text-sm">Connections: ${(d.sourceLinks?.length || 0) + (d.targetLinks?.length || 0)}</div>
          `);

        d3.select(this).attr('stroke-width', 2);
      })
      .on('mousemove', function(event) {
        const tooltip = d3.select(tooltipRef.current);
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
      })
      .on('mouseout', function() {
        d3.select(tooltipRef.current).style('visibility', 'hidden');
        d3.select(this).attr('stroke-width', 1);
      });

    // Add labels
    node.append('text')
      .attr('x', d => d.x0! < innerWidth / 2 ? d.x1! + 6 : d.x0! - 6)
      .attr('y', d => (d.y1! + d.y0!) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0! < innerWidth / 2 ? 'start' : 'end')
      .text(d => d.id)
      .attr('font-size', '10px')
      .attr('fill', 'currentColor')
      .clone(true).lower()
      .attr('stroke', 'var(--background)')
      .attr('stroke-width', 3);

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

  }, [nodes, links, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="border border-border rounded max-w-full" />
      <div
        ref={tooltipRef}
        className="absolute invisible bg-background text-foreground border border-border rounded-lg p-3 shadow-lg pointer-events-none z-10"
        style={{ maxWidth: '250px' }}
      />
      <div className="mt-2 text-xs text-muted-foreground">
        <p>💡 Flow shows parent → child relationships • Hover for details • Width indicates number of connections</p>
      </div>
    </div>
  );
};

export default SankeyDiagram;
