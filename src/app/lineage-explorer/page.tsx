"use client";

import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import LineageExplorer from '@/components/d3/LineageExplorer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RawDataRow {
  Parent: string;
  Child: string;
  Domain: string;
  Classification: string;
  Allegiance: string;
  Description: string;
}

export default function ForceGraphPage() {
  const [data, setData] = useState<RawDataRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    d3.csv('/data/greek_gods_full_lineage_with_categories.csv').then((rawData: any[]) => {
      const typedData = rawData as RawDataRow[];
      setData(typedData);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-muted-foreground">Loading Greek mythology lineage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Greek Mythology Lineage Explorer</h1>
        <p className="text-lg text-muted-foreground">
          Navigate through the generations of Greek deities, exploring parent-child relationships
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Interactive Lineage Visualisation</CardTitle>
          <CardDescription>
            D3-powered tree visualisation showing parent-child relationships. Click nodes to explore deeper into the family tree.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LineageExplorer data={data} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>About this Visualisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              This visualisation uses D3.js to create an interactive tree layout showing parent-child relationships.
              The parent deity is displayed at the top as a large node, with children arranged in an arc below,
              connected by curved paths (Bézier curves).
            </p>
            <p>
              Click any child node to view their detailed information. If they have children, you can explore deeper
              into that lineage. Node colours indicate allegiance, and small badges show the number of descendants.
            </p>
            <p className="mt-2">
              This combines D3&apos;s SVG rendering and layout algorithms with React&apos;s state management
              for an interactive exploration experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why This Approach?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="space-y-2">
              <li><strong>D3 SVG rendering</strong> - Nodes and links are positioned and drawn using D3&apos;s selection and data binding</li>
              <li><strong>Dynamic layout</strong> - Children are positioned in an arc using trigonometry, creating a radial tree structure</li>
              <li><strong>Smooth interactions</strong> - D3 transitions provide smooth hover effects on nodes</li>
              <li><strong>React integration</strong> - State management and event handlers combine with D3&apos;s visualisation power</li>
            </ul>
            <div className="mt-3 p-3 bg-muted rounded">
              <p className="text-xs font-semibold mb-1">💡 D3 + React Pattern</p>
              <p className="text-xs text-muted-foreground">
                D3 handles all the visual rendering (SVG elements, positioning, curves), while React manages
                the application state (current deity, history, selection). This separation of concerns
                creates a powerful combination.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Dataset Information</h3>
        <p className="text-sm text-muted-foreground">
          This explorer uses a dataset of {data.length} parent-child relationships from Greek mythology,
          spanning from primordial chaos through Titans, Olympians, and their many descendants.
          The interactive format makes it easy to explore the intricate web of divine genealogy
          without getting lost in the complexity.
        </p>
      </div>
    </div>
  );
}
