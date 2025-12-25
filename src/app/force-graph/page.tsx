"use client";

import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import ForceDirectedGraph from '@/components/d3/ForceDirectedGraph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RawDataRow {
  Parent: string;
  Child: string;
  Domain: string;
  Classification: string;
  Allegiance: string;
}

interface Node {
  id: string;
  group: string;
  allegiance: string;
  domain: string;
}

interface Link {
  source: string;
  target: string;
}

export default function ForceGraphPage() {
  const [data, setData] = useState<{ nodes: Node[]; links: Link[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    d3.csv('/data/greek_gods_full_lineage_with_categories.csv').then((rawData: any[]) => {
      const typedData = rawData as RawDataRow[];

      // Create nodes and links from the CSV data
      const nodeMap = new Map<string, Node>();
      const links: Link[] = [];

      typedData.forEach(row => {
        // Add parent node
        if (!nodeMap.has(row.Parent)) {
          nodeMap.set(row.Parent, {
            id: row.Parent,
            group: 'Unknown',
            allegiance: 'Neutral',
            domain: 'Unknown',
          });
        }

        // Add child node
        if (!nodeMap.has(row.Child)) {
          nodeMap.set(row.Child, {
            id: row.Child,
            group: row.Classification,
            allegiance: row.Allegiance,
            domain: row.Domain,
          });
        } else {
          // Update child node with more specific info
          const node = nodeMap.get(row.Child)!;
          node.group = row.Classification;
          node.allegiance = row.Allegiance;
          node.domain = row.Domain;
        }

        // Add link
        links.push({
          source: row.Parent,
          target: row.Child,
        });
      });

      const nodes = Array.from(nodeMap.values());

      setData({ nodes, links });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-muted-foreground">Loading Greek mythology network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Force-Directed Graph</h1>
        <p className="text-lg text-muted-foreground">
          Interactive network visualization of Greek mythology lineage
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Greek Gods Family Tree</CardTitle>
          <CardDescription>
            Explore the relationships between {data.nodes.length} deities from Greek mythology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForceDirectedGraph data={data} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>About this Visualization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              This force-directed graph uses D3's force simulation to visualize the complex
              relationships in Greek mythology. Each node represents a deity or mythological entity,
              and links show parent-child relationships.
            </p>
            <p>
              The color of each node indicates their allegiance:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><span className="text-green-400">Green</span> - Benevolent deities</li>
              <li><span className="text-blue-400">Blue</span> - Neutral entities</li>
              <li><span className="text-red-400">Red</span> - Malevolent beings</li>
              <li><span className="text-purple-400">Purple</span> - Chaotic forces</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interaction Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="space-y-2">
              <li><strong>Drag nodes</strong> - Click and drag any node to reposition it</li>
              <li><strong>Highlight connections</strong> - Click a node to see its direct relationships</li>
              <li><strong>Zoom</strong> - Use mouse wheel to zoom in and out</li>
              <li><strong>Pan</strong> - Click and drag the background to move the entire graph</li>
              <li><strong>Hover</strong> - Hover over nodes to see detailed information</li>
              <li><strong>Reset</strong> - Click the background to clear highlighting</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Dataset Information</h3>
        <p className="text-sm text-muted-foreground">
          This visualization uses a dataset of Greek mythology lineage, showing relationships between
          primordial beings, Titans, Olympians, and other mythological entities. The network contains{' '}
          {data.nodes.length} nodes and {data.links.length} connections.
        </p>
      </div>
    </div>
  );
}
