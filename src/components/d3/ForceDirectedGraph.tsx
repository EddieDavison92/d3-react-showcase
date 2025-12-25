import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: string;
  allegiance: string;
  domain: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

interface ForceDirectedGraphProps {
  data: {
    nodes: Node[];
    links: Link[];
  };
  width?: number;
  height?: number;
}

const ForceDirectedGraph: React.FC<ForceDirectedGraphProps> = ({
  data,
  width = 1200,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!data.nodes.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create a color scale based on allegiance
    const allegianceColors: Record<string, string> = {
      'Benevolent': '#4ade80',
      'Neutral': '#60a5fa',
      'Malevolent': '#f87171',
      'Chaotic': '#a78bfa',
    };

    // Create the simulation
    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(data.links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create container for zoom
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create arrow markers for directed graph
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles to nodes
    node.append('circle')
      .attr('r', 8)
      .attr('fill', d => allegianceColors[d.allegiance] || '#gray')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Add labels to nodes
    node.append('text')
      .text(d => d.id)
      .attr('x', 12)
      .attr('y', 4)
      .attr('font-size', '10px')
      .attr('fill', 'currentColor')
      .style('pointer-events', 'none');

    // Add tooltips
    node.on('mouseover', function(event, d) {
      d3.select(this).select('circle')
        .attr('r', 12)
        .attr('stroke-width', 3);

      const tooltip = d3.select(tooltipRef.current);
      tooltip
        .style('visibility', 'visible')
        .html(`
          <div class="font-bold text-sm">${d.id}</div>
          <div class="text-xs mt-1">
            <div><span class="font-semibold">Domain:</span> ${d.domain}</div>
            <div><span class="font-semibold">Type:</span> ${d.group}</div>
            <div><span class="font-semibold">Allegiance:</span> ${d.allegiance}</div>
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
      d3.select(this).select('circle')
        .attr('r', 8)
        .attr('stroke-width', 2);

      d3.select(tooltipRef.current)
        .style('visibility', 'hidden');
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      setSelectedNode(d.id);

      // Highlight connected nodes
      const connectedNodes = new Set<string>();
      connectedNodes.add(d.id);

      data.links.forEach(link => {
        const source = typeof link.source === 'object' ? link.source.id : link.source;
        const target = typeof link.target === 'object' ? link.target.id : link.target;

        if (source === d.id) connectedNodes.add(target);
        if (target === d.id) connectedNodes.add(source);
      });

      // Update node opacity
      node.select('circle')
        .attr('opacity', n => connectedNodes.has(n.id) ? 1 : 0.2);

      node.select('text')
        .attr('opacity', n => connectedNodes.has(n.id) ? 1 : 0.2);

      // Update link opacity
      link.attr('opacity', l => {
        const source = typeof l.source === 'object' ? l.source.id : l.source;
        const target = typeof l.target === 'object' ? l.target.id : l.target;
        return (source === d.id || target === d.id) ? 1 : 0.1;
      });
    });

    // Click on background to reset
    svg.on('click', () => {
      setSelectedNode(null);
      node.select('circle').attr('opacity', 1);
      node.select('text').attr('opacity', 1);
      link.attr('opacity', 1);
    });

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [data, width, height]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-border rounded"
      />
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
        <p>💡 Drag nodes to reposition • Click nodes to highlight connections • Scroll to zoom • Drag background to pan</p>
      </div>
    </div>
  );
};

export default ForceDirectedGraph;
