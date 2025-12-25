"use client";

import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import CollapsibleTree from '@/components/d3/CollapsibleTree';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RawDataRow {
  Parent: string;
  Child: string;
  Domain: string;
  Classification: string;
  Allegiance: string;
}

interface TreeNode {
  name: string;
  children?: TreeNode[];
  domain?: string;
  classification?: string;
  allegiance?: string;
}

export default function ForceGraphPage() {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    d3.csv('/data/greek_gods_full_lineage_with_categories.csv').then((rawData: any[]) => {
      const typedData = rawData as RawDataRow[];

      // Build tree structure from parent-child relationships
      const nodeMap = new Map<string, TreeNode>();

      // First pass: create all nodes
      typedData.forEach(row => {
        if (!nodeMap.has(row.Child)) {
          nodeMap.set(row.Child, {
            name: row.Child,
            children: [],
            domain: row.Domain,
            classification: row.Classification,
            allegiance: row.Allegiance,
          });
        } else {
          // Update existing node with details
          const node = nodeMap.get(row.Child)!;
          node.domain = row.Domain;
          node.classification = row.Classification;
          node.allegiance = row.Allegiance;
        }

        if (!nodeMap.has(row.Parent)) {
          nodeMap.set(row.Parent, {
            name: row.Parent,
            children: [],
          });
        }
      });

      // Second pass: build parent-child relationships
      typedData.forEach(row => {
        const parent = nodeMap.get(row.Parent);
        const child = nodeMap.get(row.Child);
        if (parent && child && !parent.children?.includes(child)) {
          parent.children!.push(child);
        }
      });

      // Find root nodes (nodes that are not children of anyone)
      const childrenSet = new Set<string>();
      typedData.forEach(row => childrenSet.add(row.Child));

      const roots: TreeNode[] = [];
      nodeMap.forEach((node, name) => {
        if (!childrenSet.has(name)) {
          roots.push(node);
        }
      });

      // Create a single root if multiple roots exist
      const tree: TreeNode = roots.length === 1
        ? roots[0]
        : {
            name: 'Greek Mythology',
            children: roots,
          };

      setTreeData(tree);
      setLoading(false);
    });
  }, []);

  if (loading || !treeData) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-muted-foreground">Loading Greek mythology family tree...</p>
        </div>
      </div>
    );
  }

  const countNodes = (node: TreeNode): number => {
    let count = 1;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + countNodes(child), 0);
    }
    return count;
  };

  const totalNodes = countNodes(treeData);

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Greek Mythology Family Tree</h1>
        <p className="text-lg text-muted-foreground">
          Interactive hierarchical tree visualization of divine lineage
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Collapsible Tree Diagram</CardTitle>
          <CardDescription>
            Explore the genealogical relationships between {totalNodes} deities from Greek mythology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CollapsibleTree data={treeData} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>About this Visualization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              This collapsible tree diagram shows the hierarchical lineage of Greek mythology from
              the primordial deities down through multiple generations. The layout makes it easy to
              trace family lines and understand divine genealogy.
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
            <p className="mt-2">
              Nodes with a <strong>−</strong> symbol can be collapsed, while <strong>+</strong> indicates
              collapsed nodes that can be expanded.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interaction Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ul className="space-y-2">
              <li><strong>Expand/Collapse</strong> - Click nodes to show or hide their descendants</li>
              <li><strong>Hover for details</strong> - See domain, type, and allegiance information</li>
              <li><strong>Zoom</strong> - Use mouse wheel to zoom in and out</li>
              <li><strong>Pan</strong> - Click and drag to move around the tree</li>
              <li><strong>Navigate efficiently</strong> - Start collapsed, then expand branches of interest</li>
            </ul>
            <div className="mt-3 p-3 bg-muted rounded">
              <p className="text-xs font-semibold mb-1">💡 Pro Tip</p>
              <p className="text-xs text-muted-foreground">
                The tree starts with deeper levels collapsed to reduce visual complexity. Click on nodes
                with the <strong>+</strong> symbol to explore their descendants.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Dataset Information</h3>
        <p className="text-sm text-muted-foreground">
          This visualization uses a dataset of Greek mythology lineage showing parent-child relationships
          from the primordial chaos through Titans, Olympians, and their descendants. The tree structure
          makes it much easier to understand genealogical connections compared to a force-directed layout.
          Total entities: {totalNodes}.
        </p>
      </div>
    </div>
  );
}
