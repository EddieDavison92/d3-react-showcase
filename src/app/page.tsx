import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-4 mt-8 mx-auto max-w-6xl">
      <h1 className="text-3xl text-centre font-bold">D3 React Showcase</h1>
      <p className="text-centre mt-4">
        All of the graphics below have been designed using the{" "}
        <a href="https://d3js.org/" target="_blank" className="font-medium text-primary underline underline-offset-4">D3</a>
        {" "}javascript library as React components with swappable data and parameters.
      </p>
      <div className="mt-8 space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Animated Choropleth Map</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This interactive map visualises the normalised age distribution across ICBs. It uses D3&apos;s geo-projection combined with proj4 to create the map and project it to British coordinates, featuring a swappable colour scale to highlight the proportion of people in specific age groups.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="animated-choropleth">View Choropleth Map</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brushable Scatterplot Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This component displays a matrix of scatterplots that compare pairs of measures. It uses D3&apos;s brushing feature to enable users to select and highlight data points interactively across multiple scatterplots, facilitating the identification of correlations and patterns within the dataset.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="scatterplot-matrix">View Scatterplot Matrix</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temperature Anomaly Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This heatmap visualises global temperature anomalies since 1880. It leverages D3&apos;s scale and axis features to show the gradient of temperature changes across months and years. Additionally supports brushing for data selection and export.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="heatmap">View Heatmap</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Greek Mythology Family Tree</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              This collapsible tree diagram visualizes the genealogical relationships between Greek deities using D3&apos;s tree layout. Click to expand/collapse branches, hover for details, and explore the divine lineage from primordial chaos through multiple generations with color-coded allegiances.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="force-graph">View Family Tree</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hierarchical Visualizations</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Explore hierarchical data through two complementary views: a radial sunburst chart and a rectangular treemap. Both visualizations display a technology stack hierarchy with interactive zooming, tooltips, and size-proportional representations.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="hierarchical">View Hierarchical Charts</a>
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
