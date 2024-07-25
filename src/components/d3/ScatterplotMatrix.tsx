import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTheme } from 'next-themes';

interface DataItem {
  [key: string]: number | string;
  species: string;
  island: string;
  sex: string;
}

interface ScatterplotMatrixProps {
  data: DataItem[];
  columns: string[];
  dimension: string;
}

// Define the schemeObservable10 color scheme
const schemeObservable10 = [
    '#3366CC', '#DC3912','#109618', '#FF9900', '#990099',
    '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
  ];

const ScatterplotMatrix: React.FC<ScatterplotMatrixProps> = ({ data, columns, dimension }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();

  const color = d3.scaleOrdinal<string>()
    .domain(Array.from(new Set(data.map(d => d[dimension] as string))))
    .range(schemeObservable10);

  useEffect(() => {
    if (data.length === 0 || columns.length === 0) return;

    const width = 1000;
    const height = 1000;
    const padding = 28;
    const size = (width - (columns.length + 1) * padding) / columns.length + padding;

    const x = columns.map(col =>
      d3.scaleLinear()
        .domain(d3.extent(data, d => +d[col]) as [number, number])
        .rangeRound([padding / 2, size - padding / 2])
    );

    const y = x.map(scale => scale.copy().range([size - padding / 2, padding / 2]));

    const axisx = d3.axisBottom<number>(x[0])
      .ticks(6)
      .tickSize(size * columns.length);

    const axisy = d3.axisLeft<number>(y[0])
      .ticks(6)
      .tickSize(-size * columns.length);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-padding, 0, width, height] as any)
      .style('shape-rendering', 'geometricPrecision');

    svg.append('style')
      .text(`
        circle.hidden { fill: var(--background); fill-opacity: 0.8; r: 1px; }
        circle { shape-rendering: geometricPrecision; stroke: none; stroke-width: 0.5px; }
      `);

    // Clear previous elements
    svg.selectAll('*').remove();

    // Append only one axis group
    svg.selectAll('.axis').remove();

    svg.append('g')
      .attr('class', 'axis')
      .call(g => g.selectAll('g')
        .data(x)
        .join('g')
        .attr('transform', (_, i) => `translate(${i * size},0)`)
        .each(function (d) { d3.select(this as any).call(axisx.scale(d)); })
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick line').attr('stroke', '#ddd')));

    svg.append('g')
      .attr('class', 'axis')
      .call(g => g.selectAll('g')
        .data(y)
        .join('g')
        .attr('transform', (_, i) => `translate(0,${i * size})`)
        .each(function (d) { d3.select(this as any).call(axisy.scale(d)); })
        .call(g => g.select('.domain').remove())
        .call(g => g.selectAll('.tick line').attr('stroke', '#ddd')));

    const cell = svg.append('g')
      .selectAll('g')
      .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
      .join('g')
      .attr('transform', ([i, j]) => `translate(${i * size},${j * size})`);

    cell.append('rect')
      .attr('fill', 'none')
      .attr('stroke', '#aaa')
      .attr('x', padding / 2 + 0.5)
      .attr('y', padding / 2 + 0.5)
      .attr('width', size - padding)
      .attr('height', size - padding);

    // Render black dots (background dots) initially hidden
    cell.each(function ([i, j]) {
      d3.select(this).selectAll('.background-dot')
        .data(data)
        .join('circle')
        .attr('class', 'background-dot hidden')
        .attr('cx', d => x[i](+d[columns[i]]))
        .attr('cy', d => y[j](+d[columns[j]]))
        .attr('r', 1)  // radius for black dots
        .attr('fill', theme === 'dark' ? '#fff' : '#000');
    });

    // Render coloured circles (foreground circles)
    cell.each(function ([i, j]) {
      d3.select(this).selectAll('.foreground-circle')
        .data(data)
        .join('circle')
        .attr('class', 'foreground-circle')
        .attr('cx', d => x[i](+d[columns[i]]))
        .attr('cy', d => y[j](+d[columns[j]]))
        .attr('r', 3)  // radius for coloured circles
        .attr('fill', d => color(d[dimension] as string))
        .attr('fill-opacity', 0.7);
    });

    const brush = d3.brush<SVGGElement>()
      .extent([[padding / 2, padding / 2], [size - padding / 2, size - padding / 2]])
      .on('start', function(event) {
        brushstarted.call(this, event);
      })
      .on('brush', function(event) {
        const cellData = d3.select(this).datum() as [number, number];
        brushed.call(this, event, cellData);
      })
      .on('end', function(event) {
        brushended.call(this, event);
      });

    cell.call(brush as any);

    let brushCell: SVGGElement | null;

    function brushstarted(this: SVGGElement, event: d3.D3BrushEvent<SVGGElement>) {
      if (brushCell !== this && brushCell !== null) {
        d3.select<SVGGElement, unknown>(brushCell).call(brush.move as any, null);
        brushCell = this;
      }
      // Show black dots when brushing starts
      d3.selectAll('.background-dot').classed('hidden', false);
    }

    function brushed(event: d3.D3BrushEvent<SVGGElement>, [i, j]: [number, number]) {
      const selection = event.selection as [[number, number], [number, number]];
      if (selection) {
        const [[x0, y0], [x1, y1]] = selection;
        d3.selectAll('.foreground-circle').classed('hidden', function(d: any) {
          const datum = d as DataItem;
          return x0 > x[i](+datum[columns[i]]) ||
            x1 < x[i](+datum[columns[i]]) ||
            y0 > y[j](+datum[columns[j]]) ||
            y1 < y[j](+datum[columns[j]]);
        });
        d3.selectAll('.background-dot').classed('hidden', function(d: any) {
          const datum = d as DataItem;
          return !(x0 > x[i](+datum[columns[i]]) ||
            x1 < x[i](+datum[columns[i]]) ||
            y0 > y[j](+datum[columns[j]]) ||
            y1 < y[j](+datum[columns[j]]));
        });
      } else {
        d3.selectAll('.foreground-circle').classed('hidden', false);
        d3.selectAll('.background-dot').classed('hidden', true);
      }
    }

    function brushended(event: d3.D3BrushEvent<SVGGElement>) {
      if (!event.selection) {
        d3.selectAll('.foreground-circle').classed('hidden', false);
        d3.selectAll('.background-dot').classed('hidden', true);
      }
    }

    // Append titles only once
    svg.selectAll('.title').remove();

    svg.append('g')
      .attr('class', 'title')
      .style('font', 'bold 14px sans-serif')
      .style('pointer-events', 'none')
      .style('fill', theme === 'dark' ? '#fff' : '#000') // Use the foreground colour for the titles
      .selectAll('text')
      .data(columns)
      .join('text')
      .attr('transform', (_, i) => `translate(${i * size},${i * size})`)
      .attr('x', padding)
      .attr('y', padding)
      .attr('dy', '.71em')
      .text(d => d);

    svg.property('value', []);

  }, [data, columns, dimension, theme, color]);

  const legendData = color.domain();

  const formatText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  return (
    <div>
      <div className="mt-2 flex items-center">
        <span className="font-bold mr-2">Legend:</span>
        {legendData.map((d, i) => (
          <div key={i} className="flex items-center mr-4">
            <div style={{ width: '10px', height: '10px', backgroundColor: color(d), marginRight: '5px' }}></div>
            <span>{formatText(d)}</span>
          </div>
        ))}
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ScatterplotMatrix;
