import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-4 mt-8 mx-auto max-w-6xl">
      <h1 className="text-3xl text-centre font-bold">D3 React Showcase</h1>
      <p className="text-centre mt-4">
        All of the below graphics have been designed using the{" "}
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
              This interactive map visualises data changes over time across different regions. It uses D3&apos;s geo-projection to create the map and uses a swappable colour scale to reflect the normalised proportion of people of a particular age. An Area Chart is displayed after selecting a region to provide a view of all ages for that region.
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
              This component showcases a matrix of scatterplots comparing pairs of variables. It utilises D3&apos;s brushing feature to allow users to select and highlight data points interactively across multiple scatterplots. This facilitates the identification of correlations and patterns within the dataset. The matrix is dynamically generated based on the dataset&apos;s dimensions, and each cell in the matrix represents a unique scatterplot of two variables.
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
              This heatmap visualises temperature anomalies since 1880. It employs D3&apos;s scale and axis features to create a comprehensive view of data variation across months and years. The heatmap supports brushing for selecting and focusing on specific periods, making it easier to analyse trends and anomalies. The colour scale represents temperature deviations from the average, providing a clear visualisation of temperature changes over time.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="heatmap">View Heatmap</a>
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
