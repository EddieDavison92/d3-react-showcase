import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { FeatureCollection, GeoJsonProperties, Geometry, Polygon, MultiPolygon } from "geojson";
import proj4 from "proj4";

proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");

interface AnimatedChoroplethMapProps {
  jsonDataPath: string;
  geojsonPath: string;
  idField: string;
  nameField: string;
  dimensionField: string;
  valueField: string;
  proportionField: string;
  joinCondition: (jsonRow: any, geojsonProperties: any) => boolean;
  colorScheme: (t: number) => string;
  currentDimension: number;
  setSelectedRegion: (region: any) => void;
  formatTooltipText: (name: string) => string;
}

const AnimatedChoroplethMap: React.FC<AnimatedChoroplethMapProps> = ({
  jsonDataPath,
  geojsonPath,
  idField,
  nameField,
  dimensionField,
  valueField,
  proportionField,
  joinCondition,
  colorScheme,
  currentDimension,
  setSelectedRegion,
  formatTooltipText
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [geojson, setGeojson] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);

  useEffect(() => {
    d3.json(jsonDataPath).then((data: unknown) => {
      const jsonData = data as any[];
      setData(jsonData);
    });

    d3.json(geojsonPath).then((data) => {
      const reprojectedGeojson = reprojectGeojson(data as FeatureCollection<Geometry, GeoJsonProperties>);
      setGeojson(reprojectedGeojson);
    });
  }, [jsonDataPath, geojsonPath]);

  const reprojectGeojson = (geojson: FeatureCollection<Geometry, GeoJsonProperties>): FeatureCollection<Geometry, GeoJsonProperties> => {
    geojson.features.forEach((feature) => {
      if (feature.geometry.type === "Polygon") {
        feature.geometry.coordinates = (feature.geometry as Polygon).coordinates.map((ring: any) => {
          return ring.map((coord: [number, number]) => {
            const [x, y] = proj4("EPSG:27700", "EPSG:4326", coord);
            return [x, y];
          });
        });
      } else if (feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates = (feature.geometry as MultiPolygon).coordinates.map((polygon: any) => {
          return polygon.map((ring: any) => {
            return ring.map((coord: [number, number]) => {
              const [x, y] = proj4("EPSG:27700", "EPSG:4326", coord);
              return [x, y];
            });
          });
        });
      }
    });
    return geojson;
  };

  const filteredData = useMemo(() => data.filter(d => +d[dimensionField] === currentDimension), [data, dimensionField, currentDimension]);

  const minProportion = useMemo(() => d3.min(filteredData, d => d[proportionField]) || 0, [filteredData, proportionField]);
  const maxProportion = useMemo(() => d3.max(filteredData, d => d[proportionField]) || 1, [filteredData, proportionField]);

  const colorScale = useMemo(() => {
    return d3.scaleSequential(colorScheme).domain([minProportion, maxProportion]);
  }, [minProportion, maxProportion, colorScheme]);

  const updateMap = useCallback(() => {
    if (!geojson || !svgRef.current || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoMercator()
      .fitSize([width, height], geojson);
    const path = d3.geoPath().projection(projection);

    const tooltipDiv = d3.select<HTMLDivElement, unknown>(tooltipRef.current as HTMLDivElement);

    const paths = svg.selectAll<SVGPathElement, d3.GeoPermissibleObjects>("path")
      .data(geojson.features);

    paths.enter().append("path")
      .merge(paths)
      .attr("d", path as any)
      .attr("fill", d => {
        const properties = d.properties || {};
        const dataRow = filteredData.find(row => joinCondition(row, properties));
        const proportion = dataRow ? dataRow[proportionField] : 0;
        return colorScale(proportion);
      })
      .attr("stroke", "#000")
      .attr("stroke-width", "0.5")
      .on("mouseover.tooltip", function(event, d: any) {
        const [mouseX, mouseY] = d3.pointer(event);
        const properties = d.properties || {};
        const name = formatTooltipText(properties[nameField] || "");
        const dataRow = filteredData.find(row => joinCondition(row, properties));
        const observation = dataRow ? dataRow[valueField] : 0;
        const proportion = dataRow ? dataRow[proportionField] : 0;
        tooltipDiv.style("display", "block")
          .html(`<span class="font-bold">${name}</span><br/><span>${observation.toLocaleString()} (${proportion.toFixed(3)}%)</span>`);
        setTooltipPosition(event, tooltipDiv, mapContainerRef);
        d3.select(this).attr("stroke-width", "2.5");
      })
      .on("mousemove.tooltip", function(event) {
        setTooltipPosition(event, tooltipDiv, mapContainerRef);
      })
      .on("mouseleave.tooltip", function() {
        tooltipDiv.style("display", "none");
        d3.select(this).attr("stroke-width", "0.5");
      })
      .on("click", function(event, d) {
        const properties = d.properties || {};
        setSelectedRegion(properties);
      });

    paths.exit().remove();
  }, [geojson, colorScale, filteredData, nameField, proportionField, joinCondition, valueField, setSelectedRegion, formatTooltipText]);

  const setTooltipPosition = (event: MouseEvent, tooltipDiv: d3.Selection<HTMLDivElement, unknown, null, undefined>, containerRef: React.RefObject<HTMLDivElement>) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;

    const pageWidth = window.innerWidth;
    const horizontalOffset = pageWidth > 1150 ? 120 : pageWidth < 950 ? 20 : 20 + (120 - 20) * (pageWidth - 950) / (1150 - 950);
    const verticalOffset = 5;

    let left = mouseX + horizontalOffset;
    let top = mouseY + verticalOffset;

    tooltipDiv.style("left", `${left}px`).style("top", `${top}px`);
  };

  useEffect(() => {
    const handleResize = () => {
      updateMap();
    };

    window.addEventListener('resize', handleResize);
    updateMap();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentDimension, updateMap]);

  return (
    <div className="relative p-4">
      <div className="flex justify-center text-foreground">
        <svg width="200" height="50">
          <defs>
            <linearGradient id="colorGradient">
              <stop offset="0%" stopColor={colorScheme(0)} />
              <stop offset="25%" stopColor={colorScheme(0.25)} />
              <stop offset="50%" stopColor={colorScheme(0.5)} />
              <stop offset="75%" stopColor={colorScheme(0.75)} />
              <stop offset="100%" stopColor={colorScheme(1)} />
            </linearGradient>
          </defs>
          <rect width="100%" height="20" fill="url(#colorGradient)" />
          <text x="0" y="35" fontSize="12" fill="currentColor">{minProportion.toFixed(2)}%</text>
          <text x="200" y="35" fontSize="12" textAnchor="end" fill="currentColor">{maxProportion.toFixed(2)}%</text>
        </svg>
      </div>
      <div ref={mapContainerRef} className="relative mx-auto max-w-4xl flex justify-center w-full" style={{ height: '600px' }}>
        <svg ref={svgRef} className="block w-full h-full"></svg>
      </div>
      <div ref={tooltipRef} className="absolute bg-background text-foreground border border-border rounded p-2 pointer-events-none text-sm z-[100]" style={{ display: 'none', whiteSpace: 'nowrap' }}></div>
    </div>
  );
};

export default AnimatedChoroplethMap;
