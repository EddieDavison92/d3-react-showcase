import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface DataPoint {
    Year: number;
    Anomaly: number | null;
    YearFloor: number;
    MonthIndex: number;
}

interface TemperatureAnomalyHeatmapProps {
    data: DataPoint[];
    enableBrushing: boolean;
    setBrushedData: React.Dispatch<React.SetStateAction<DataPoint[]>>;
    setIsBrushed: React.Dispatch<React.SetStateAction<boolean>>;
    colorScale: d3.ScaleSequential<string>;
    months: string[];
}

const MARGIN = { top: 20, right: 60, bottom: 20, left: 40 };
const LEGEND_DIMENSIONS = { height: 300, width: 20 };

const TemperatureAnomalyHeatmap: React.FC<TemperatureAnomalyHeatmapProps> = ({
    data,
    enableBrushing,
    setBrushedData,
    setIsBrushed,
    colorScale,
    months
}) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const legendBrushRef = useRef<d3.BrushBehavior<unknown> | null>(null);
    const heatmapBrushRef = useRef<d3.BrushBehavior<unknown> | null>(null);

    useEffect(() => {
        if (data.length === 0) return;

        const container = svgRef.current?.parentElement;
        const width = container ? container.clientWidth - MARGIN.left - MARGIN.right : 960;
        const height = 600 - MARGIN.top - MARGIN.bottom;

        const svg = d3.select(svgRef.current)
            .attr('viewBox', `0 0 ${width + MARGIN.left + MARGIN.right} ${height + MARGIN.top + MARGIN.bottom}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        svg.selectAll('*').remove();

        const g = svg.append('g')
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

        const years = Array.from(new Set(data.map(d => d.YearFloor)));

        const x = d3.scaleLinear()
            .domain([d3.min(years)!, d3.max(years)! + 1])
            .range([0, width]);

        const y = d3.scaleBand()
            .domain(months)
            .range([0, height])
            .padding(0.1);

        const cellWidth = width / years.length;
        const cellHeight = y.bandwidth();

        const cells = g.append('g')
            .selectAll<SVGRectElement, DataPoint>('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => x(d.YearFloor))
            .attr('y', d => y(months[d.MonthIndex])!)
            .attr('width', cellWidth)
            .attr('height', cellHeight)
            .attr('fill', d => colorScale(d.Anomaly as number))
            .attr('stroke', '#ccc');

        appendLegend(g, width, height, colorScale, setBrushedData, setIsBrushed, data, cells, legendBrushRef, heatmapBrushRef);
        appendAxes(g, x, y, width, height, years);

        if (enableBrushing) {
            addBrushing(g, cells, x, y, cellWidth, cellHeight, height, data, setBrushedData, setIsBrushed, legendBrushRef, heatmapBrushRef, months);
        }

        cells.on('mouseover', function (event, d) {
            d3.select(this).attr('stroke', '#000');

            d3.select(tooltipRef.current)
                .style('visibility', 'visible')
                .html(`<strong>Year:</strong> ${d.YearFloor}<br><strong>Month:</strong> ${months[d.MonthIndex]}<br><strong>Anomaly:</strong> ${d.Anomaly?.toFixed(2)}°C`);
        })
        .on('mousemove', function (event) {
            setTooltipPosition(event, tooltipRef);
        })
        .on('mouseout', function () {
            d3.select(this).attr('stroke', '#ccc');
            d3.select(tooltipRef.current).style('visibility', 'hidden');
        });

    }, [data, enableBrushing, setBrushedData, setIsBrushed, colorScale, months]);

    return (
        <div className="w-full">
            <svg ref={svgRef}></svg>
            <div
                ref={tooltipRef}
                className="tooltip absolute invisible bg-white border border-gray-300 p-2 rounded shadow-lg pointer-events-none"
            ></div>
        </div>
    );
};

const appendLegend = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    color: d3.ScaleSequential<string>,
    setBrushedData: React.Dispatch<React.SetStateAction<DataPoint[]>>,
    setIsBrushed: React.Dispatch<React.SetStateAction<boolean>>,
    data: DataPoint[],
    cells: d3.Selection<SVGRectElement, DataPoint, SVGGElement, unknown>,
    legendBrushRef: React.MutableRefObject<d3.BrushBehavior<unknown> | null>,
    heatmapBrushRef: React.MutableRefObject<d3.BrushBehavior<unknown> | null>
) => {
    const legendHeight = Math.min(height, LEGEND_DIMENSIONS.height);
    const defs = g.append('defs');

    const linearGradient = defs.append('linearGradient')
        .attr('id', 'linear-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

    linearGradient.selectAll('stop')
        .data(d3.range(0, 1.01, 0.01).map(t => ({ offset: `${t * 100}%`, color: d3.interpolateRdYlBu(t) })))
        .enter().append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

    g.append('rect')
        .attr('x', width + 10)
        .attr('y', 0)
        .attr('width', LEGEND_DIMENSIONS.width)
        .attr('height', legendHeight)
        .style('fill', 'url(#linear-gradient)');

    const legendScale = d3.scaleLinear()
        .domain(color.domain())
        .range([0, legendHeight]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(6)
        .tickFormat(d => `${d}°C`);

    g.append('g')
        .attr('class', 'legend-axis')
        .attr('transform', `translate(${width + 30}, 0)`)
        .call(legendAxis);

    const legendBrush = d3.brushY<unknown>()
        .extent([[width + 10, 0], [width + 30, legendHeight]])
        .on('start', () => {
            if (heatmapBrushRef.current) {
                d3.select<SVGGElement, unknown>('.brush').call(heatmapBrushRef.current.move, null);
            }
        })
        .on('brush end', (event) => {
            const extent = event.selection;
            if (extent) {
                const [y0, y1] = extent;
                const minValue = legendScale.invert(y1);
                const maxValue = legendScale.invert(y0);

                const selectedData = data.filter(d => d.Anomaly !== null && d.Anomaly >= minValue && d.Anomaly <= maxValue);
                setIsBrushed(true);
                setBrushedData(selectedData.sort((a, b) => b.Year - a.Year));

                cells.attr('opacity', d => {
                    const isWithinRange = d.Anomaly !== null && d.Anomaly >= minValue && d.Anomaly <= maxValue;
                    return isWithinRange ? 1 : 0.2;
                });
            } else {
                setIsBrushed(false);
                setBrushedData([]);
                cells.attr('opacity', 1);
            }
        });

    legendBrushRef.current = legendBrush;

    g.append('g')
        .attr('class', 'legend-brush')
        .call(legendBrush);
};

const appendAxes = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleBand<string>,
    width: number,
    height: number,
    years: number[]
) => {
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d3.format('d') as unknown as (domainValue: number | { valueOf(): number }, index: number) => string)
            .ticks(years.length / 10));

    g.append('g')
        .call(d3.axisLeft(y));
};

const addBrushing = (
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    cells: d3.Selection<SVGRectElement, DataPoint, SVGGElement, unknown>,
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleBand<string>,
    cellWidth: number,
    cellHeight: number,
    height: number,
    data: DataPoint[],
    setBrushedData: React.Dispatch<React.SetStateAction<DataPoint[]>>,
    setIsBrushed: React.Dispatch<React.SetStateAction<boolean>>,
    legendBrushRef: React.MutableRefObject<d3.BrushBehavior<unknown> | null>,
    heatmapBrushRef: React.MutableRefObject<d3.BrushBehavior<unknown> | null>,
    months: string[]
) => {
    const heatmapBrush = d3.brush<unknown>()
        .extent([[0, 0], [x.range()[1], height]])
        .on('start', () => {
            if (legendBrushRef.current) {
                d3.select<SVGGElement, unknown>('.legend-brush').call(legendBrushRef.current.move, null);
            }
        })
        .on('brush end', (event) => {
            const extent = event.selection;
            if (extent) {
                setIsBrushed(true);
                const [[x0, y0], [x1, y1]] = extent;
                const selectedData = data.filter(d => {
                    const cellX = x(d.YearFloor);
                    const cellY = y(months[d.MonthIndex])!;
                    return (
                        cellX < x1 && cellX + cellWidth > x0 &&
                        cellY < y1 && cellY + cellHeight > y0
                    );
                });
                setBrushedData(selectedData.sort((a, b) => b.Year - a.Year));
                cells.attr('opacity', d => selectedData.includes(d) ? 1 : 0.2);
            } else {
                setIsBrushed(false);
                setBrushedData([]);
                cells.attr('opacity', 1);
            }
        });

    heatmapBrushRef.current = heatmapBrush;

    g.append('g')
        .attr('class', 'brush')
        .call(heatmapBrush);
};

const setTooltipPosition = (event: MouseEvent, tooltipRef: React.RefObject<HTMLDivElement>) => {
    const tooltipDiv = d3.select(tooltipRef.current);
    const pageX = event.pageX;
    const pageY = event.pageY;

    const tooltipWidth = tooltipDiv.node()?.offsetWidth || 0;
    const tooltipHeight = tooltipDiv.node()?.offsetHeight || 0;

    let left = pageX + 10;
    let top = pageY + 10;

    if (left + tooltipWidth > window.innerWidth) {
        left = pageX - tooltipWidth - 10;
    }

    if (top + tooltipHeight > window.innerHeight) {
        top = pageY - tooltipHeight - 10;
    }

    tooltipDiv.style('left', `${left}px`).style('top', `${top}px`);
};

export default TemperatureAnomalyHeatmap;
