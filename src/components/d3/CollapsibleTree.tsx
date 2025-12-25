import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface TreeNode {
  name: string;
  children?: TreeNode[];
  domain?: string;
  classification?: string;
  allegiance?: string;
}

interface CollapsibleTreeProps {
  data: TreeNode;
  width?: number;
  height?: number;
}

const CollapsibleTree: React.FC<CollapsibleTreeProps> = ({
  data,
  width = 2000,
  height = 1200,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 200, bottom: 20, left: 200 };

    // Calculate dimensions based on data depth
    const maxDepth = getMaxDepth(data);
    const nodeSize = { width: 180, height: 40 };
    const innerWidth = maxDepth * nodeSize.width;
    const innerHeight = height - margin.top - margin.bottom;

    // Create tree layout with fixed node size
    const tree = d3.tree<TreeNode>()
      .nodeSize([nodeSize.height, nodeSize.width])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.2));

    // Create hierarchy
    const root = d3.hierarchy(data);

    // Collapse all nodes initially except first three levels
    root.descendants().forEach(d => {
      if (d.depth > 2) {
        (d as any)._children = d.children;
        (d as any).children = null;
      }
    });

    tree(root);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${innerWidth + margin.left + margin.right} ${height}`)
      .call(zoom);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${height / 2})`);

    // Color scale based on allegiance
    const allegianceColors: Record<string, string> = {
      'Benevolent': '#4ade80',
      'Neutral': '#60a5fa',
      'Malevolent': '#f87171',
      'Chaotic': '#a78bfa',
    };

    let i = 0;

    function update(source: any) {
      const duration = 300;
      const nodes = root.descendants();
      const links = root.links();

      // Compute the new tree layout
      tree(root);

      // Update nodes
      const node = g.selectAll('g.node')
        .data(nodes, (d: any) => d.id || (d.id = ++i));

      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0 || 0},${source.x0 || 0})`)
        .on('click', (event, d: any) => {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update(d);
        })
        .style('cursor', 'pointer');

      // Add circles
      nodeEnter.append('circle')
        .attr('r', 6)
        .attr('fill', d => {
          const allegiance = (d.data as any).allegiance || 'Neutral';
          return allegianceColors[allegiance] || '#999';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // Add text labels
      nodeEnter.append('text')
        .attr('dy', '.31em')
        .attr('x', d => (d as any).children || (d as any)._children ? -10 : 10)
        .attr('text-anchor', d => (d as any).children || (d as any)._children ? 'end' : 'start')
        .text(d => d.data.name)
        .attr('font-size', '11px')
        .attr('fill', 'currentColor')
        .clone(true).lower()
        .attr('stroke', 'var(--background)')
        .attr('stroke-width', 3);

      // Add collapse indicator
      nodeEnter.append('text')
        .attr('x', d => (d as any).children || (d as any)._children ? -18 : 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', 'currentColor')
        .attr('opacity', 0.6)
        .text(d => (d as any)._children ? '+' : (d as any).children ? '−' : '');

      // Tooltip
      nodeEnter
        .on('mouseover', function(event, d) {
          const nodeData = d.data as any;
          const tooltip = d3.select(tooltipRef.current);

          tooltip
            .style('visibility', 'visible')
            .html(`
              <div class="font-bold text-sm">${nodeData.name}</div>
              ${nodeData.domain ? `<div class="text-xs mt-1"><span class="font-semibold">Domain:</span> ${nodeData.domain}</div>` : ''}
              ${nodeData.classification ? `<div class="text-xs"><span class="font-semibold">Type:</span> ${nodeData.classification}</div>` : ''}
              ${nodeData.allegiance ? `<div class="text-xs"><span class="font-semibold">Allegiance:</span> ${nodeData.allegiance}</div>` : ''}
              ${(d as any).children ? `<div class="text-xs mt-1 text-muted-foreground">${(d as any).children.length} children</div>` : ''}
              ${(d as any)._children ? `<div class="text-xs mt-1 text-muted-foreground">${(d as any)._children.length} children (collapsed)</div>` : ''}
            `);

          d3.select(this).select('circle')
            .attr('r', 8)
            .attr('stroke-width', 3);
        })
        .on('mousemove', function(event) {
          const tooltip = d3.select(tooltipRef.current);
          tooltip
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`);
        })
        .on('mouseout', function() {
          d3.select(tooltipRef.current)
            .style('visibility', 'hidden');

          d3.select(this).select('circle')
            .attr('r', 6)
            .attr('stroke-width', 2);
        });

      // Transition nodes to their new position
      const nodeUpdate = nodeEnter.merge(node as any);

      nodeUpdate.transition()
        .duration(duration)
        .attr('transform', d => `translate(${(d as any).y},${(d as any).x})`);

      nodeUpdate.select('circle')
        .attr('fill', d => {
          const allegiance = (d.data as any).allegiance || 'Neutral';
          return allegianceColors[allegiance] || '#999';
        });

      // Transition exiting nodes
      const nodeExit = node.exit().transition()
        .duration(duration)
        .attr('transform', d => `translate(${source.y},${source.x})`)
        .remove();

      nodeExit.select('circle')
        .attr('r', 0);

      nodeExit.select('text')
        .style('fill-opacity', 0);

      // Update links
      const link = g.selectAll('path.link')
        .data(links, (d: any) => d.target.id);

      const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', d => {
          const o = { x: source.x0 || 0, y: source.y0 || 0 };
          return diagonal(o, o);
        })
        .attr('fill', 'none')
        .attr('stroke', '#999')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5);

      const linkUpdate = linkEnter.merge(link as any);

      linkUpdate.transition()
        .duration(duration)
        .attr('d', d => diagonal(d.source as any, d.target as any));

      link.exit().transition()
        .duration(duration)
        .attr('d', d => {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      // Store old positions
      nodes.forEach((d: any) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    function diagonal(s: any, d: any) {
      return `M ${s.y} ${s.x}
              C ${(s.y + d.y) / 2} ${s.x},
                ${(s.y + d.y) / 2} ${d.x},
                ${d.y} ${d.x}`;
    }

    update(root);

    // Center initial view
    svg.call(zoom.transform as any, d3.zoomIdentity.translate(margin.left, 0).scale(0.8));

  }, [data, width, height]);

  function getMaxDepth(node: TreeNode, currentDepth = 0): number {
    if (!node.children || node.children.length === 0) return currentDepth;
    return Math.max(...node.children.map(child => getMaxDepth(child, currentDepth + 1)));
  }

  return (
    <div ref={containerRef} className="relative">
      <svg ref={svgRef} className="border border-border rounded max-w-full" />
      <div
        ref={tooltipRef}
        className="absolute invisible bg-background text-foreground border border-border rounded-lg p-3 shadow-lg pointer-events-none z-10"
        style={{ maxWidth: '250px' }}
      />
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="text-sm">
          <span className="font-bold">Legend:</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-sm">Benevolent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span className="text-sm">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <span className="text-sm">Malevolent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-400"></div>
          <span className="text-sm">Chaotic</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        <p>💡 Click nodes to expand/collapse • Hover for details • Scroll to zoom • Drag to pan</p>
      </div>
    </div>
  );
};

export default CollapsibleTree;
