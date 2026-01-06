"use client";

import React, { useState, useEffect } from "react";
import AnimatedChoroplethMap from "@/components/d3/AnimatedChoroplethMap";
import AreaChart from "@/components/d3/AreaChart";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { Button } from "@/components/ui/button";
import D3ColourSelector from "@/components/d3/d3-colour-selector";
import { PlayIcon, StopIcon } from '@radix-ui/react-icons';
import * as d3 from "d3";
import { VisualizationLayout } from '@/components/layouts/VisualizationLayout';
import { VisualizationSidebarSection } from '@/components/ui/visualization-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">Loading census data...</p>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <VisualizationSidebarSection title="About">
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="text-muted-foreground">
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
            <p className="text-muted-foreground">
              The regions on the map are colour-coded to reflect the proportion of the population in each single-year age group, normalised across England.
            </p>
            <p className="text-muted-foreground">
              Click &quot;Start&quot; to observe the population distribution transitioning through each age group, or drag the slider.
            </p>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>

      <VisualizationSidebarSection title="Controls">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Colour Scheme</label>
              <D3ColourSelector onSelect={handleSchemeSelect} />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Animation</label>
              <Button onClick={toggleAnimation} variant={isAnimating ? "outline" : "default"} className="w-full">
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
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Current Age: {currentDimension}</label>
              <RangeSlider value={[currentDimension]} onValueChange={handleDimensionChange} min={0} max={100} step={1} />
            </div>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>

      {selectedRegion && (
        <VisualizationSidebarSection title="Selected Region">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">{handleNameTruncation(selectedRegion["ICB22NM"])}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-xs text-muted-foreground">Total Population</p>
              <p className="text-2xl font-bold">
                {data.filter((d) => d["ICBCode"] === selectedRegion["ICB22CD"]).reduce((acc, d) => acc + d["Obs"], 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                View age distribution chart below the map
              </p>
            </CardContent>
          </Card>
        </VisualizationSidebarSection>
      )}

      {!selectedRegion && (
        <VisualizationSidebarSection title="">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                Click on a region to see detailed information
              </p>
            </CardContent>
          </Card>
        </VisualizationSidebarSection>
      )}
    </>
  );

  return (
    <VisualizationLayout
      title="Animated Choropleth Map"
      description="Explore UK population distribution by age across Integrated Care Boards"
      sidebarContent={sidebarContent}
      sidebarDefaultOpen={true}
    >
      <div className="space-y-6">
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

        {selectedRegion && (
          <Card>
            <CardHeader>
              <CardTitle>{handleNameTruncation(selectedRegion["ICB22NM"])} - Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </div>
    </VisualizationLayout>
  );
}
