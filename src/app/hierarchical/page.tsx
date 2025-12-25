"use client";

import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import SunburstChart from '@/components/d3/SunburstChart';
import TreemapChart from '@/components/d3/TreemapChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HierarchyNode {
  name: string;
  value?: number;
  children?: HierarchyNode[];
}

export default function HierarchicalPage() {
  const [data, setData] = useState<HierarchyNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    d3.json('/data/tech-hierarchy.json').then((jsonData: any) => {
      setData(jsonData as HierarchyNode);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-muted-foreground">Loading hierarchical data...</p>
        </div>
      </div>
    );
  }

  const totalValue = calculateTotal(data);

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Hierarchical Visualizations</h1>
        <p className="text-lg text-muted-foreground">
          Explore technology stack data through multiple hierarchical views
        </p>
      </div>

      <Tabs defaultValue="sunburst" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sunburst">Sunburst Chart</TabsTrigger>
          <TabsTrigger value="treemap">Treemap</TabsTrigger>
        </TabsList>

        <TabsContent value="sunburst">
          <Card>
            <CardHeader>
              <CardTitle>Sunburst Chart</CardTitle>
              <CardDescription>
                A radial space-filling visualization showing hierarchical relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SunburstChart data={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treemap">
          <Card>
            <CardHeader>
              <CardTitle>Treemap</CardTitle>
              <CardDescription>
                A rectangular space-filling visualization using nested rectangles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TreemapChart data={data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>About Hierarchical Visualizations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Sunburst Chart</h4>
              <p className="text-muted-foreground">
                A sunburst chart displays hierarchical data in a circular layout. The center represents
                the root, with each ring representing a deeper level. Arc size corresponds to the value
                of each node. Perfect for showing part-to-whole relationships in hierarchies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Treemap</h4>
              <p className="text-muted-foreground">
                A treemap uses nested rectangles to represent hierarchical data. The area of each rectangle
                is proportional to its value. Colors typically represent different categories at the top
                level. Excellent for comparing sizes within a hierarchy.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dataset Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-muted rounded">
                <div className="text-2xl font-bold">{countNodes(data)}</div>
                <div className="text-xs text-muted-foreground">Total Items</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-2xl font-bold">{getDepth(data)}</div>
                <div className="text-xs text-muted-foreground">Max Depth</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-2xl font-bold">{data.children?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Top Categories</div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Categories:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {data.children?.map((child, i) => (
                  <li key={i}>{child.name}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">About This Dataset</h3>
        <p className="text-sm text-muted-foreground">
          This visualization uses a hierarchical dataset representing a modern technology stack, organized
          into major categories like Frontend, Backend, DevOps, and Tools. Each leaf node has a value
          representing relative usage or popularity. The data structure demonstrates how different
          technologies relate to each other within the broader ecosystem.
        </p>
      </div>
    </div>
  );
}

function calculateTotal(node: HierarchyNode): number {
  if (node.value) return node.value;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + calculateTotal(child), 0);
}

function countNodes(node: HierarchyNode): number {
  let count = 1;
  if (node.children) {
    count += node.children.reduce((sum, child) => sum + countNodes(child), 0);
  }
  return count;
}

function getDepth(node: HierarchyNode, currentDepth = 1): number {
  if (!node.children || node.children.length === 0) return currentDepth;
  return Math.max(...node.children.map(child => getDepth(child, currentDepth + 1)));
}
