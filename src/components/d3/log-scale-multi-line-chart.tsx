"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface DataElement {
  Period: string | Date
  [key: string]: any
}

interface D3VisualizationProps {
  data: DataElement[]
}

export const D3Visualization: React.FC<D3VisualizationProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 800
    const height = 600
    const margin = { top: 20, right: 20, bottom: 30, left: 30 }

    const x = d3.scaleUtc()
      .domain(d3.extent(data, d => new Date(d.Period as string)) as [Date, Date])
      .range([margin.left, width - margin.right])

    const y = d3.scaleLog()
      .domain([1, d3.max(data, d => Math.max(d["A&E Attendances"], d["Waits Over 4 Hours"])) as number])
      .range([height - margin.bottom, margin.top])

    const line = d3.line<DataElement>()
      .defined(d => !isNaN(d["A&E Attendances"]))
      .x(d => x(new Date(d.Period as string)))
      .y(d => y(d["A&E Attendances"]))

    const line2 = d3.line<DataElement>()
      .defined(d => !isNaN(d["Waits Over 4 Hours"]))
      .x(d => x(new Date(d.Period as string)))
      .y(d => y(d["Waits Over 4 Hours"]))

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(10, "~s"))
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("↑ Value (log scale)"))

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line)

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5)
      .attr("d", line2)

    if (data.length > 0 && data[data.length - 1]["A&E Attendances"] !== undefined) {
      svg.append("text")
        .attr("x", width - margin.right)
        .attr("y", y(data[data.length - 1]["A&E Attendances"]))
        .attr("dy", "-0.5em")
        .attr("text-anchor", "end")
        .attr("font-size", "10px")
        .text("A&E Attendances")
    }

    if (data.length > 0 && data[data.length - 1]["Waits Over 4 Hours"] !== undefined) {
      svg.append("text")
        .attr("x", width - margin.right)
        .attr("y", y(data[data.length - 1]["Waits Over 4 Hours"]))
        .attr("dy", "-0.5em")
        .attr("text-anchor", "end")
        .attr("font-size", "10px")
        .text("Waits Over 4 Hours")
    }
  }, [data])

  return (
    <svg ref={svgRef} width="800" height="600" />
  )
}
