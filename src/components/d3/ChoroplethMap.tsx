import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { FeatureCollection, GeoJsonProperties, Geometry, Polygon, MultiPolygon } from "geojson";
import proj4 from "proj4";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { debounce } from "@/utils/debounce";

// Define the EPSG:27700 projection (British National Grid) and EPSG:4326 (WGS84)
proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");

const ChoroplethMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [ageRange, setAgeRange] = useState<number[]>([0, 100]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [geojson, setGeojson] = useState<FeatureCollection<Geometry, GeoJsonProperties> | null>(null);

  // Load data from CSV and GeoJSON files when the component mounts
  useEffect(() => {
    // Load age data from CSV file
    d3.csv("/data/TS007_icb.csv").then((data) => {
      setAgeData(data);
    });

    // Load GeoJSON data and reproject it
    d3.json("/data/icb_2023.geojson").then((data) => {
      const reprojectedGeojson = reprojectGeojson(data as FeatureCollection<Geometry, GeoJsonProperties>);
      setGeojson(reprojectedGeojson);
    });
  }, []);

  // Function to reproject GeoJSON coordinates from EPSG:27700 to EPSG:4326
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

  // Function to update the map visualization
  const updateMap = useCallback((geojson: FeatureCollection<Geometry, GeoJsonProperties>) => {
    const width = 1200;
    const height = 1400;

    // Select the SVG element and set its dimensions
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Create a D3 projection to map geographical coordinates to SVG coordinates
    const projection = d3.geoMercator()
      .fitSize([width, height], geojson);

    // Create a D3 path generator using the projection
    const path = d3.geoPath().projection(projection);

    // Filter age data based on the selected age range
    const ageFilteredData = ageData.filter(d => +d["Age (101 categories) Code"] >= ageRange[0] && +d["Age (101 categories) Code"] <= ageRange[1]);

    // Sum the populations for each ICB within the selected age range
    const icbPopulationMap = new Map<string, number>();
    const icbTotalPopulationMap = new Map<string, number>();
    ageFilteredData.forEach(d => {
      const icbCode = d["Integrated care boards Code"];
      const population = +d.Observation;
      if (icbPopulationMap.has(icbCode)) {
        icbPopulationMap.set(icbCode, icbPopulationMap.get(icbCode)! + population);
      } else {
        icbPopulationMap.set(icbCode, population);
      }
    });

    // Sum the total populations for each ICB
    ageData.forEach(d => {
      const icbCode = d["Integrated care boards Code"];
      const population = +d.Observation;
      if (icbTotalPopulationMap.has(icbCode)) {
        icbTotalPopulationMap.set(icbCode, icbTotalPopulationMap.get(icbCode)! + population);
      } else {
        icbTotalPopulationMap.set(icbCode, population);
      }
    });

    // Calculate the proportion of the population for the selected age range within each ICB
    const icbProportionMap = new Map<string, number>();
    icbPopulationMap.forEach((value, key) => {
      const totalPopulation = icbTotalPopulationMap.get(key) || 1;
      icbProportionMap.set(key, value / totalPopulation);
    });

    // Determine the maximum proportion for the selected age range
    const maxProportion = d3.max(Array.from(icbProportionMap.values())) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxProportion]);

    // Clear existing paths
    svg.selectAll("path").remove();

    // Select tooltip div
    const tooltipDiv = d3.select(tooltipRef.current as HTMLDivElement);

    // Add paths for each feature in the GeoJSON data
    svg.selectAll("path")
      .data(geojson.features)
      .enter().append("path")
      .attr("d", path as any)
      .attr("fill", d => {
        const icbCode = d.properties ? d.properties["ICB23CD"] : null;
        const icbProportion = icbProportionMap.get(icbCode) || 0;
        return colorScale(icbProportion);
      })
      .attr("stroke", "#000") // Add a thin border
      .attr("stroke-width", "0.5") // Set border width
      .on("mouseover.tooltip", function(event, d: any) {
        const [mouseX, mouseY] = d3.pointer(event);
        const icbCode = d.properties ? d.properties["ICB23CD"] : null;
        const icbName = d.properties ? d.properties["ICB23NM"].replace("Integrated Care Board", "ICB") : "";
        const icbPopulation = icbPopulationMap.get(icbCode) || 0;
        tooltipDiv.style("display", "block")
          .html(`<span class="font-bold">${icbName}</span><br/><span>${icbCode}</span><br/><span>${icbPopulation.toLocaleString()}</span>`);
        setTooltipPosition(mouseX, mouseY, tooltipDiv);
      })
      .on("mousemove.tooltip", function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        setTooltipPosition(mouseX, mouseY, tooltipDiv);
      })
      .on("mouseleave.tooltip", function() {
        tooltipDiv.style("display", "none");
      });

  }, [ageData, ageRange]);

  // Function to set the position of the tooltip
  const setTooltipPosition = (mouseX: number, mouseY: number, tooltipDiv: d3.Selection<HTMLDivElement, unknown, null, undefined>) => {
    const svgElement = svgRef.current;
    if (svgElement) {
      const svgRect = svgElement.getBoundingClientRect();
      const tooltipWidth = tooltipDiv.node()?.getBoundingClientRect().width || 0;
      const tooltipHeight = tooltipDiv.node()?.getBoundingClientRect().height || 0;
      
      tooltipDiv.style("left", `${svgRect.left + mouseX - 5}px`)
        .style("top", `${svgRect.top + mouseY - tooltipHeight -10}px`);
    }
  };

  // Effect to update the map whenever the age range selection changes
  useEffect(() => {
    if (geojson) {
      updateMap(geojson);
    }
  }, [ageRange, geojson, updateMap]);

  // Handler for age range changes
  const handleAgeRangeChange = (newValue: number[]) => {
    setAgeRange(newValue);
  };

  return (
    <div className="relative p-4">
      <div className="flex justify-center">
        <label className="mr-2">Age Range:</label>
        <div className="w-64 m-2">
          <RangeSlider
            defaultValue={ageRange}
            onValueChange={handleAgeRangeChange}
            min={0}
            max={100}
            step={1}
          />
        </div>
        <div className="ml-4">
          <span>{ageRange[0]}</span> - <span>{ageRange[1]}</span>
        </div>
      </div>
      <svg ref={svgRef} className="mx-auto mt-2 block"></svg>
      <div ref={tooltipRef} className="absolute bg-white border border-gray-400 rounded p-2 pointer-events-none text-sm" style={{ display: 'none' }}></div>
    </div>
  );
};

export default ChoroplethMap;
