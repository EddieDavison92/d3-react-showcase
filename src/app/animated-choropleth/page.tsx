"use client";

import React, { useState, useEffect } from "react";
import AnimatedChoroplethMap from "@/components/d3/AnimatedChoroplethMap";
import AreaChart from "@/components/d3/AreaChart";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Button } from "@/components/ui/button";
import D3ColourSelector from "@/components/d3/d3-colour-selector";
import { PlayIcon, StopIcon } from '@radix-ui/react-icons';
import * as d3 from "d3";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentDimension, setCurrentDimension] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [colorScheme, setColorScheme] = useState<(t: number) => string>(() => d3.interpolateBlues);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50);

    d3.json("/data/TS007_icb.json").then((data: unknown) => {
      setData(data as any[]);
    });

    return () => clearTimeout(timer);
  }, []);

  const toggleAnimation = () => {
    if (isAnimating) {
      if (intervalId) {
        clearInterval(intervalId);
        setIsAnimating(false);
      }
    } else {
      setIsAnimating(true);
      const id = setInterval(() => {
        setCurrentDimension((prev) => {
          if (prev >= 100) {
            clearInterval(id);
            setIsAnimating(false);
            return prev;
          }
          return prev + 1;
        });
      }, 400);
      setIntervalId(id);
    }
  };

  const handleDimensionChange = (newValue: number[]) => {
    setCurrentDimension(newValue[0]);
    if (intervalId) {
      clearInterval(intervalId);
      setIsAnimating(false);
    }
  };

  const handleNameTruncation = (name: string) => {
    return name.replace("Integrated Care Board", "ICB");
  };

  const handleSchemeSelect = (scheme: string) => {
    if (typeof d3[scheme as keyof typeof d3] === "function") {
      setColorScheme(() => d3[scheme as keyof typeof d3] as (t: number) => string);
    } else {
      console.error(`Selected scheme ${scheme} is not a function`);
    }
  };

  return (
    <div className="p-4 mx-auto max-w-6xl">
      <h1 className="text-2xl text-left mt-4 font-bold mb-4">Animated Choropleth Map</h1>
      <p className="mb-4 text-left">
        This map displays the proportion of the population in each region by single-year age groups, utilising data from the{" "}
        <a
          className="font-medium text-primary underline underline-offset-4"
          href="https://www.ons.gov.uk/datasets/TS007/editions/2021/versions/3"
          target="_blank"
          rel="noopener noreferrer"
        >
          2021 Census 
        </a>
        {" "}provided by the Office for National Statistics.
      </p>
      <p className="mb-4 text-left">
        The regions on the map are colour-coded to reflect the proportion of the population in each single-year age group, normalised across England. 
       </p>
      <p className="mb-4 text-left"> 
        Click &quot;Start&quot; to observe the population distribution transitioning through each age group, or drag the slider.
      </p>
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          <div className="flex">
            <label className="mr-2 mt-2 font-semibold mb-4">Select Colour Scheme:</label>
            <D3ColourSelector onSelect={handleSchemeSelect} />
          </div>
          <div className="flex justify-center mt-4 mb-2">
            <Button onClick={toggleAnimation} variant={isAnimating ? "outline" : "default"} className="mr-4">
              {isAnimating ? (
                <>
                  <StopIcon className="mr-2 h-4 w-4" /> Stop
                </>
              ) : (
                <>
                  <PlayIcon className="mr-2 h-4 w-4" /> Start
                </>
              )}
            </Button>
            <div className="ml-2 mt-1">
              <span className="text-lg font-bold">Current Age: {currentDimension}</span>
            </div>
          </div>
          <div className="flex justify-center my-4">
            <label className="mr-2">Select Age:</label>
            <div className="w-64 mt-2">
              <RangeSlider value={[currentDimension]} onValueChange={handleDimensionChange} min={0} max={100} step={1} />
            </div>
          </div>
          <AnimatedChoroplethMap
            jsonDataPath="/data/TS007_icb.json"
            geojsonPath="/data/icb_2022_BUC.geojson"
            idField="ICB22CD"
            nameField="ICB22NM"
            dimensionField="AgeCode"
            valueField="Obs"
            proportionField="Prop"
            joinCondition={(jsonRow, geojsonProperties) => jsonRow["ICBCode"] === geojsonProperties["ICB22CD"]}
            colorScheme={colorScheme}
            currentDimension={currentDimension}
            setSelectedRegion={setSelectedRegion}
            formatTooltipText={handleNameTruncation}
          />
          {selectedRegion ? (
            <div className="flex flex-col items-start max-w-2xl mt-8 mx-auto">
              <h2 className="text-xl text-left font-bold mb-2">{handleNameTruncation(selectedRegion["ICB22NM"])}</h2>
              <p className="text-lg font-bold mt-2 mb-2">
                Population: {data.filter((d) => d["ICBCode"] === selectedRegion["ICB22CD"]).reduce((acc, d) => acc + d["Obs"], 0).toLocaleString()}
              </p>
              <p className="text-left mb-2">This chart shows the number of people in single year-ages for the selected region.</p>
              <AreaChart
                data={data.filter((d) => d["ICBCode"] === selectedRegion["ICB22CD"])}
                valueField="Obs"
                dimensionField="AgeCode"
                proportionField="Prop"
                colorScheme={colorScheme}
                xLabel="Age"
                yLabel="Number of People"
                tooltipDimensionLabel="Age"
                tooltipValueLabel="People"
              />
            </div>
          ) : (
            <p className="text-center font-bold mt-4">Click on a region to see more detail</p>
          )}
        </>
      )}
    </div>
  );
}
