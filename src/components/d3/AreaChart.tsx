import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface AreaChartProps {
  data: any[];
  valueField: string;
  dimensionField: string;
  proportionField: string;
  colorScheme: (t: number) => string;
  xLabel: string;
  yLabel: string;
  tooltipValueLabel: string;
  tooltipDimensionLabel: string;
}

const AreaChart: React.FC<AreaChartProps> = ({ data, valueField, dimensionField, proportionField, colorScheme, xLabel, yLabel, tooltipValueLabel, tooltipDimensionLabel }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const circleRef = useRef<SVGCircleElement | null>(null);

  useEffect(() => {
    const renderChart = () => {
      if (!svgRef.current) return;
      const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
      const container = svgRef.current.parentElement;
      const width = container ? container.clientWidth : 800;
      const height = 400;
      const margin = { top: 20, right: 30, bottom: 50, left: 80 };

      svg.attr("width", width).attr("height", height);

      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d[dimensionField]) as [number, number])
        .range([margin.left, width - margin.right]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[valueField]) as number])
        .range([height - margin.bottom, margin.top]);

      const area = d3.area<any>()
        .x(d => x(d[dimensionField]))
        .y0(height - margin.bottom)
        .y1(d => y(d[valueField]));

      const gradientId = "gradient";

      let defs = svg.select<SVGDefsElement>("defs");
      if (defs.empty()) {
        defs = svg.append<SVGDefsElement>("defs");
      }

      // Remove existing gradient
      svg.select(`#${gradientId}`).remove();

      let linearGradient = defs.append<SVGLinearGradientElement>("linearGradient")
        .attr("id", gradientId)
        .attr("gradientTransform", "rotate(90)");

      // Create gradient stops using the provided colorScheme
      const stopsData = [
        { offset: "0%", color: colorScheme(0.8) },
        { offset: "65%", color: colorScheme(0.5) },
        { offset: "100%", color: colorScheme(0.2) }
      ];

      linearGradient.selectAll("stop")
        .data(stopsData)
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color)
        .attr("stop-opacity", 1);

      const yAxisGroup = svg.selectAll<SVGGElement, null>(".y-axis")
        .data([null]);

      const yAxisEnter = yAxisGroup.enter().append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`);

      const yAxisUpdate = yAxisEnter.merge(yAxisGroup);

      yAxisUpdate.transition()
        .duration(yAxisGroup.size() > 0 ? 300 : 0)
        .call(d3.axisLeft(y).ticks(10, "s").tickFormat(d => `${d}`) as any)
        .selectAll("text")
        .attr("class", "text-xs font-bold");

      const xAxisGroup = svg.selectAll<SVGGElement, null>(".x-axis")
        .data([null]);

      const xAxisEnter = xAxisGroup.enter().append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.bottom})`);

      const xAxisUpdate = xAxisEnter.merge(xAxisGroup);

      xAxisUpdate.transition()
        .duration(xAxisGroup.size() > 0 ? 300 : 0)
        .call(d3.axisBottom(x).ticks(10).tickFormat(d3.format(".0f")) as any)
        .selectAll("text")
        .attr("class", "text-xs font-bold");

      const areaPath = svg.selectAll<SVGPathElement, any[]>(".area")
        .data([data]);

      areaPath.enter().append("path")
        .attr("class", "area")
        .attr("fill", `url(#${gradientId})`)
        .merge(areaPath)
        .transition()
        .duration(300)
        .ease(d3.easeLinear)
        .attr("d", area);

      const linePath = svg.selectAll<SVGPathElement, any[]>(".line")
        .data([data]);

      linePath.enter().append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", colorScheme(1)) // Set initial stroke color
        .attr("stroke-width", 1.5)
        .merge(linePath)
        .transition()
        .duration(300)
        .ease(d3.easeLinear)
        .attr("d", d3.line<any>()
          .x(d => x(d[dimensionField]))
          .y(d => y(d[valueField]))
        )
        .attr("stroke", colorScheme(1)); // Ensure stroke color is updated

      let tooltip = d3.select(tooltipRef.current as HTMLDivElement);
      if (tooltip.empty()) {
        tooltip = d3.select(svgRef.current!.parentElement!).append("div")
          .attr("class", "absolute bg-background text-foreground border border-border rounded p-2 pointer-events-none text-sm")
          .style("display", "none")
          .style("white-space", "nowrap");
      }

      let circle = svg.selectAll<SVGCircleElement, null>(".tooltip-circle")
        .data([null]);

      circle.enter().append("circle")
        .attr("class", "tooltip-circle")
        .attr("r", 4)
        .attr("fill", colorScheme(1)) // Set initial fill color
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .style("display", "none")
        .merge(circle)
        .attr("r", 4)
        .attr("fill", colorScheme(1)) // Ensure fill color is updated
        .attr("stroke", "white")
        .attr("stroke-width", 1.5);

      svg.on("mousemove", (event) => {
        const [mouseX, mouseY] = d3.pointer(event);
        const x0 = x.invert(mouseX);
        const i = d3.bisector((d: any) => d[dimensionField]).left(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i] || d0;
        const d = x0 - d0[dimensionField] > (d1 ? d1[dimensionField] - x0 : Infinity) ? d1 : d0;

        const cx = x(d[dimensionField]);
        const cy = y(d[valueField]);

        circle.attr("cx", cx)
          .attr("cy", cy)
          .style("display", "block");

        const containerRect = svgRef.current?.getBoundingClientRect();
        if (containerRect) {
          const totalPopulation = data.reduce((acc, dataPoint) => acc + dataPoint[valueField], 0);
          const proportion = totalPopulation ? d[valueField] / totalPopulation : 0;

          tooltip.style("left", `${cx + 5}px`)
            .style("top", `${cy + containerRect.top - (svgRef.current?.getBoundingClientRect()?.top || 0) - 50}px`)
            .style("display", "block")
            .html(`<span class="font-bold">${tooltipDimensionLabel}:</span> ${d[dimensionField]}<br><span class="font-bold">${tooltipValueLabel}:</span> ${d[valueField].toLocaleString()} (${(proportion * 100).toFixed(3)}%)`);
        }
      });

      svg.on("mouseout", () => {
        circle.style("display", "none");
        tooltip.style("display", "none");
      });
    };

    renderChart();

    const resizeObserver = new ResizeObserver(() => {
      renderChart();
    });

    resizeObserver.observe(svgRef.current!.parentElement!);

    return () => {
      resizeObserver.disconnect();
    };
  }, [data, valueField, dimensionField, proportionField, colorScheme, tooltipDimensionLabel, tooltipValueLabel]);

  return (
    <div className="relative w-full">
      <svg ref={svgRef} className="mx-auto mt-4 block w-full"></svg>
      <div ref={tooltipRef} className="absolute bg-background text-foreground border border-border rounded p-2 pointer-events-none text-sm" style={{ display: 'none', whiteSpace: 'nowrap' }}></div>
      <div className="absolute text-xs font-bold" style={{ left: "54%", bottom: "10px", transform: "translateX(-50%)" }}>{xLabel}</div>
      <div className="absolute text-xs font-bold" style={{ left: "-35px", top: "46%", transform: "translateY(-50%) rotate(-90deg)" }}>{yLabel}</div>
    </div>
  );
};

export default AreaChart;
