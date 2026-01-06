"use client";

import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import LineageExplorer from '@/components/d3/LineageExplorer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VisualizationLayout } from '@/components/layouts/VisualizationLayout';
import { VisualizationSidebarSection } from '@/components/ui/visualization-sidebar';

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
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">Loading Greek mythology lineage...</p>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <VisualizationSidebarSection title="About">
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <p className="text-muted-foreground">
              This visualisation uses D3.js to create an interactive tree layout showing parent-child relationships.
            </p>
            <p className="text-muted-foreground">
              The parent deity is displayed at the top as a large node, with children arranged in an arc below,
              connected by curved paths (Bézier curves).
            </p>
            <p className="text-muted-foreground">
              Click any child node to view their detailed information. If they have children, you can explore deeper
              into that lineage.
            </p>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>

      <VisualizationSidebarSection title="How It Works">
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <ul className="space-y-2 text-muted-foreground">
              <li className="text-xs"><strong className="text-foreground">D3 SVG rendering</strong> - Nodes and links positioned using D3&apos;s selection and data binding</li>
              <li className="text-xs"><strong className="text-foreground">Dynamic layout</strong> - Children positioned in an arc using trigonometry</li>
              <li className="text-xs"><strong className="text-foreground">Smooth interactions</strong> - D3 transitions provide hover effects</li>
              <li className="text-xs"><strong className="text-foreground">React integration</strong> - State management combined with D3&apos;s power</li>
            </ul>
            <div className="mt-3 p-3 bg-muted rounded">
              <p className="text-xs font-semibold mb-1">D3 + React Pattern</p>
              <p className="text-xs text-muted-foreground">
                D3 handles visual rendering (SVG, positioning, curves), while React manages application state.
                This separation creates a powerful combination.
              </p>
            </div>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>

      <VisualizationSidebarSection title="Dataset">
        <Card>
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="p-3 bg-muted rounded">
              <div className="text-2xl font-bold">{data.length}</div>
              <div className="text-xs text-muted-foreground">Parent-child relationships</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Spanning from primordial chaos through Titans, Olympians, and their many descendants.
              The interactive format makes it easy to explore divine genealogy.
            </p>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>
    </>
  );

  return (
    <VisualizationLayout
      title="Greek Mythology Lineage Explorer"
      description="Navigate through the generations of Greek deities, exploring parent-child relationships"
      sidebarContent={sidebarContent}
      sidebarDefaultOpen={true}
    >
      <Card>
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
    </VisualizationLayout>
  );
}
