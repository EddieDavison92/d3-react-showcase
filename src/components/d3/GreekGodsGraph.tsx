import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface NodeType extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  domain: string;
  classification: string;
  allegiance: string;
}

interface LinkType extends d3.SimulationLinkDatum<NodeType> {
  source: NodeType | string;
  target: NodeType | string;
}

interface CSVRow {
  Parent: string;
  Child: string;
  Domain: string;
  Classification: string;
  Allegiance: string;
}

const GreekGodsGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // Load CSV data
    d3.csv<CSVRow>('/data/greek_gods_full_lineage_with_categories.csv', d => {
      return {
        Parent: d.Parent,
        Child: d.Child,
        Domain: d.Domain || "Unknown",
        Classification: d.Classification || "Unknown",
        Allegiance: d.Allegiance || "Neutral",
      };
    }).then(data => {
      if (data) {
        const { nodes, links } = transformDataToGraph(data);
        renderGraph(nodes, links);
      }
    });
  }, []);

  // Transform CSV data to graph data structure with unique nodes
  const transformDataToGraph = (data: CSVRow[]): { nodes: NodeType[], links: LinkType[] } => {
    const nodesMap = new Map<string, NodeType>();
    const links: LinkType[] = [];

    data.forEach(({ Parent, Child, Domain, Classification, Allegiance }) => {
      // Add child node if not already present
      if (!nodesMap.has(Child)) {
        nodesMap.set(Child, { id: Child, name: Child, domain: Domain, classification: Classification, allegiance: Allegiance });
      }
      // Add parent node if not already present
      if (!nodesMap.has(Parent)) {
        const parentRow = data.find(d => d.Child === Parent);
        const parentDomain = parentRow?.Domain || "Unknown";
        const parentClassification = parentRow?.Classification || "Unknown";
        const parentAllegiance = parentRow?.Allegiance || "Neutral";
        nodesMap.set(Parent, { id: Parent, name: Parent, domain: parentDomain, classification: parentClassification, allegiance: parentAllegiance });
      }

      links.push({ source: Parent, target: Child });
    });

    return { nodes: Array.from(nodesMap.values()), links };
  };

  // Render the graph using D3.js
  const renderGraph = (nodes: NodeType[], links: LinkType[]) => {
    const width = 1920;
    const height = 1200;

    // Colours for allegiance with enhanced differentiation
    const allegianceColor = d3.scaleOrdinal<string>()
      .domain(['Neutral', 'Benevolent', 'Chaotic', 'Malevolent'])
      .range(['#808080', '#4CAF50', '#FF4500', '#8B0000']); // Chaotic (OrangeRed), Malevolent (DarkRed)

    // Sizes for classifications with pronounced differences
    const classificationSize: Record<string, number> = {
      'Primordial': 40,    // Largest
      'Titan': 30,
      'Olympian': 25,
      'Underworld Deity': 20,
      'Hero': 18,
      'Monster': 15,
      'Nymph': 12,
      'Demigod': 10,
      'Mortal': 8,         // Smallest
      'Unknown': 6,
    };

    // Increase Chaos size and fix its position at the centre
    const chaosNode = nodes.find(node => node.id === 'Chaos');
    if (chaosNode) {
      chaosNode.fx = width / 2;
      chaosNode.fy = height / 2;
      classificationSize['Unknown'] = 80; // Make Chaos huge
    }

    // Select the SVG element and clear previous contents
    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove(); // Clear previous contents to prevent duplicates

    // Append a group for zooming
    const svg = svgElement.append('g');

    // Zoom behaviour
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .on('zoom', (event) => {
        svg.attr('transform', event.transform);
      });

    // Apply zoom to SVG if svgRef.current is not null
    if (svgRef.current) {
      d3.select(svgRef.current).call(zoom);
    }

    // Define the simulation
    const simulation = d3.forceSimulation<NodeType>(nodes)
      .force("link", d3.forceLink<NodeType, LinkType>(links).id((d: d3.SimulationNodeDatum) => (d as NodeType).id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300)) // Adjust strength to prevent overlap
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<NodeType>().radius(d => classificationSize[d.classification] || 10).strength(1)) // Collision force to prevent overlap
      .force("radial", d3.forceRadial((d: NodeType) => d.id === 'Chaos' ? 0 : 100, width / 2, height / 2).strength(0.2)); // Strong radial force for primordials

    // Draw the links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#ccc');

    // Draw the nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => classificationSize[d.classification] || 10)
      .attr('fill', d => allegianceColor(d.allegiance))
      .call(d3.drag<SVGCircleElement, NodeType>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          if (d.id !== 'Chaos') { // Keep Chaos in the centre
            d.fx = null;
            d.fy = null;
          }
        }));

    // Add labels to the nodes
    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('dy', -3)
      .attr('x', 12)
      .text(d => d.name);

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
      .style("position", "absolute")
      .style("text-align", "centre")
      .style("width", "140px")
      .style("height", "60px")
      .style("padding", "5px")
      .style("font", "12px sans-serif")
      .style("background", "lightsteelblue")
      .style("border", "0px")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("visibility", "hidden");

    node.on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible").text(`${d.name} - ${d.domain} (${d.allegiance})`);
    }).on("mousemove", (event) => {
      tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
    }).on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

    // Update simulation on each tick
    simulation.on("tick", () => {
      link.attr("x1", d => ((d.source as NodeType).x ?? 0))
        .attr("y1", d => ((d.source as NodeType).y ?? 0))
        .attr("x2", d => ((d.target as NodeType).x ?? 0))
        .attr("y2", d => ((d.target as NodeType).y ?? 0));

      node.attr("cx", d => d.x ?? 0)
        .attr("cy", d => d.y ?? 0);

      labels.attr("x", d => d.x ?? 0)
        .attr("y", d => d.y ?? 0);
    });
  };

  return (
    <div className="flex justify-centre items-centre h-screen">
      <svg ref={svgRef} width="80vw" height="80vh" className="bg-white border-2 border-gray-300 rounded-lg" />
    </div>
  );
};

export default GreekGodsGraph;
