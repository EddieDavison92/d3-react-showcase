"use client";

import React, { useEffect, useState } from "react";
import ScatterplotMatrix from "@/components/d3/ScatterplotMatrix";
import * as d3 from "d3";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";
import { VisualizationLayout } from '@/components/layouts/VisualizationLayout';
import { VisualizationSidebarSection } from '@/components/ui/visualization-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [dimension, setDimension] = useState<string>('species');

  useEffect(() => {
    d3.json("/data/penguins.json").then((rawData: unknown) => {
      const data = (rawData as any[]).filter(d => 
        !isNaN(d.culmen_length_mm) && 
        !isNaN(d.culmen_depth_mm) && 
        !isNaN(d.flipper_length_mm) && 
        !isNaN(d.body_mass_g)
      ).map(d => ({
        ...d,
        culmen_length_mm: +d.culmen_length_mm,
        culmen_depth_mm: +d.culmen_depth_mm,
        flipper_length_mm: +d.flipper_length_mm,
        body_mass_g: +d.body_mass_g
      }));

      console.log("Clean Data: ", data);
      setData(data);

      const columns = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');
      console.log("Numeric Columns: ", columns);
      setNumericColumns(columns);

      setIsLoading(false);
    });
  }, []);

  // Filter data based on the selected dimension
  const filteredData = data.filter(d => d[dimension] !== null && d[dimension] !== undefined && d[dimension] !== "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">Loading penguin data...</p>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <VisualizationSidebarSection title="About">
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="text-muted-foreground">
              The scatterplot matrix (SPLOM) shows how different measures relate to each other.
              Each cell is a scatterplot comparing two variables.
            </p>
            <p className="text-muted-foreground">
              This matrix displays{" "}
              <a className="font-medium text-primary underline underline-offset-4" href="data/penguins.csv" target="_blank">
                data
              </a>
              {" "}from Palmer Station in Antarctica collected by{" "}
              <a className="font-medium text-primary underline underline-offset-4" href="https://allisonhorst.github.io/palmerpenguins/" target="_blank">
                Kristen Gorman.
              </a>
            </p>
            <p className="text-muted-foreground">
              Inspired by{" "}
              <a className="font-medium text-primary underline underline-offset-4" href="https://observablehq.com/@d3/brushable-scatterplot-matrix" target="_blank">
                Mike Bostock&apos;s example
              </a>.
            </p>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>

      <VisualizationSidebarSection title="Controls">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-3">Colour Dimension</p>
            <RadioGroup defaultValue="species" onValueChange={(value) => setDimension(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="species" id="species" />
                <Label htmlFor="species">Species</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="island" id="island" />
                <Label htmlFor="island">Island</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sex" id="sex" />
                <Label htmlFor="sex">Sex</Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground mt-3">
              Brush over the matrix to select data points by clicking and dragging
            </p>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>

      <VisualizationSidebarSection title="Meet the Penguins">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Different species of penguins in the dataset:
              </p>
              <Image src="/img/penguins-image.jpg" alt="Penguins" width="300" height="120" className="rounded" />
            </div>
            <div>
              <p className="text-sm font-semibold mb-1">What is a Culmen?</p>
              <p className="text-xs text-muted-foreground mb-2">
                The culmen is the ridge along the top part of a bird&apos;s bill.
              </p>
              <Image src="/img/culmen_depth.png" alt="Culmen Depth" width="300" height="200" className="rounded" />
              <p className="text-xs text-muted-foreground mt-1">Artwork by @allison_horst</p>
            </div>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>
    </>
  );

  return (
    <VisualizationLayout
      title="Brushable Scatterplot Matrix"
      description="Explore relationships between penguin measurements with interactive brushing"
      sidebarContent={sidebarContent}
      sidebarDefaultOpen={true}
    >
      <ScatterplotMatrix data={filteredData} columns={numericColumns} dimension={dimension} />
    </VisualizationLayout>
  );
}