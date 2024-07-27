"use client";

import React, { useEffect, useState } from "react";
import ScatterplotMatrix from "@/components/d3/ScatterplotMatrix";
import * as d3 from "d3";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";

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

  return (
    <div className="p-4 mx-auto mt-4 max-w-6xl">
      <h1 className="text-2xl text-left font-bold mb-4">Brushable Scatterplot Matrix</h1>
      <p className="text-left my-2">
        The scatterplot matrix (SPLOM) shows how different measures relate to each other.
        Each cell is a scatterplot comparing two variables, with x representing one variable and y representing another. 
        This matrix displays <a className="font-medium text-primary underline underline-offset-4" href="data/penguins.csv" target="_blank">data</a> from Palmer Station in Antarctica collected by <a className="font-medium text-primary underline underline-offset-4" href="https://allisonhorst.github.io/palmerpenguins/" target="_blank">Kristen Gorman.</a>
      </p>
      <p className="text-left my-2">
        This chart was inspired by this <a className="font-medium text-primary underline underline-offset-4" href="https://observablehq.com/@d3/brushable-scatterplot-matrix" target="_blank">example</a> by Mike Bostock.
      </p>
      <p className="text-left my-2 font-semibold">
        You can brush over the scatterplot matrix to select a subset of the data points by clicking and dragging.
      </p>
      <p className="font-bold mt-4 mb-1">Select dimension:</p>
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
      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="mt-2">
          <ScatterplotMatrix data={filteredData} columns={numericColumns} dimension={dimension} />
          <h2 className="text-left text-2xl font-bold mt-4">Meet the Penguins</h2>
          <p className="text-left my-2">
            Here are the different species of penguins you will encounter in the dataset:
          </p>
          <Image src="/img/penguins-image.jpg" alt="Penguins" width="1000" height="400" className="mt- max-width" />
          <h3 className="text-left text-2xl font-bold mt-4">What is a Culmen?</h3>
          <p className="text-left my-2">
            The culmen is the ridge along the top part of a bird&apos;s bill. It is measured to identify and study birds and monitor their health.
          </p>
          <Image src="/img/culmen_depth.png" alt="Culmen Depth" width="600" height="400" className="mt-4 max-width" />
          <p>Artwork by @allison_horst</p>
        </div>
      )}
    </div>
  );
}