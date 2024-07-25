import * as d3 from "d3";
import React, { useRef, useEffect, useMemo } from "react";

interface DataElement {
  Period: Date;
  "Org name": string;
  "A&E Attendances": number | null;
}

interface D3VisualizationProps {
  data: DataElement[];
}

// Helper function to escape special characters for CSS selectors
const escapeCSSSelector = (str: string) => {
  return str.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

export const D3Visualization: React.FC<D3VisualizationProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const width = 960;
  const sparklineHeight = 30;
  const margin = { top: 5, right: 10, bottom: 5, left: 10 };
  const innerMargin = 5;
  const sparklineWidth = width - margin.left - margin.right;

  const xScale = useMemo(
    () =>
      d3.scaleTime()
        .domain(d3.extent(data, d => d.Period) as [Date, Date])
        .range([0, sparklineWidth]),
    [data, sparklineWidth]
  );

  const orgNames = useMemo(() => Array.from(new Set(data.map(d => d["Org name"]))), [data]);

  const yScale = useMemo(
    () =>
      d3.scaleLinear()
        .range([sparklineHeight - innerMargin, innerMargin]),
    [sparklineHeight, innerMargin]
  );

  useEffect(() => {
    if (!data || !containerRef.current) return;

    console.log("Data loaded:", data);

    orgNames.forEach(orgName => {
      const orgData = data.filter(d => d["Org name"] === orgName && d["A&E Attendances"] !== null);

      console.log(`Processing ${orgName}:`, orgData);

      if (orgData.length === 0) return;

      yScale.domain([0, d3.max(orgData, d => d["A&E Attendances"]) || 1]);

      const line = d3.line<DataElement>()
        .x(d => xScale(d.Period)!)
        .y(d => yScale(d["A&E Attendances"]!))
        .curve(d3.curveMonotoneX);

      const escapedOrgName = escapeCSSSelector(orgName);
      const sparklineGroup = d3.select(`#sparkline-${escapedOrgName}`);

      console.log(`Selected SVG #sparkline-${escapedOrgName}:`, sparklineGroup);

      sparklineGroup.selectAll("*").remove(); // Clear previous content

      sparklineGroup.append("path")
        .datum(orgData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

      sparklineGroup.selectAll(".dot")
        .data(orgData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.Period)!)
        .attr("cy", d => yScale(d["A&E Attendances"]!))
        .attr("r", 2)
        .attr("fill", "steelblue")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", (event, d) => {
          const tooltip = d3.select("#tooltip");
          tooltip.style("visibility", "visible")
            .text(`Attendances: ${d["A&E Attendances"]}`);
        })
        .on("mousemove", (event) => {
          const tooltip = d3.select("#tooltip");
          tooltip.style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
          const tooltip = d3.select("#tooltip");
          tooltip.style("visibility", "hidden");
        });

    });
  }, [data, orgNames, xScale, yScale, sparklineWidth]);

  return (
    <>
      <div id="tooltip" style={{ position: "absolute", visibility: "hidden", backgroundColor: "lightgrey", padding: "5px", borderRadius: "3px" }}></div>
      <div className="p-4" ref={containerRef}>
        <h2 className="text-xl font-bold mb-4">A&E Attendances by Organization</h2>
        {orgNames.map((orgName, i) => (
          <div key={i} className="mb-4">
            <div style={{ borderTop: "1px solid #ccc", marginTop: "10px" }}></div>
            <div className="px-2 py-1">{orgName}</div>
            <svg id={`sparkline-${escapeCSSSelector(orgName)}`} width={sparklineWidth} height={sparklineHeight}></svg>
            <div style={{ borderBottom: "1px solid #ccc", marginBottom: "10px" }}></div>
          </div>
        ))}
      </div>
    </>
  );
};
