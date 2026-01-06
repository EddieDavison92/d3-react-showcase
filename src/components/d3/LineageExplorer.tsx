"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface RawDataRow {
  Parent: string;
  Child: string;
  Domain: string;
  Classification: string;
  Allegiance: string;
  Description: string;
}

interface DeityInfo {
  name: string;
  domain?: string;
  classification?: string;
  allegiance?: string;
  description?: string;
  parents: string[];
  children: string[];
}

interface LineageExplorerProps {
  data: RawDataRow[];
}

const LineageExplorer: React.FC<LineageExplorerProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedDeity, setFocusedDeity] = useState<string>('Chaos');
  const [history, setHistory] = useState<string[]>([]);
  const [selectedDeity, setSelectedDeity] = useState<string | null>(null);

  // Build deity information map
  const deityMap = React.useMemo(() => {
    const map = new Map<string, DeityInfo>();

    // First pass: collect all deity info from when they appear as children
    const deityInfoFromChild = new Map<string, Partial<DeityInfo>>();

    // Add Chaos manually since it never appears as a child
    deityInfoFromChild.set('Chaos', {
      domain: 'Void and primordial existence',
      classification: 'Primordial',
      allegiance: 'Neutral',
      description: 'The primordial void from which all existence emerged. The first entity in Greek cosmogony, representing the formless state before creation.',
    });

    data.forEach(row => {
      if (!deityInfoFromChild.has(row.Child)) {
        deityInfoFromChild.set(row.Child, {
          domain: row.Domain,
          classification: row.Classification,
          allegiance: row.Allegiance,
          description: row.Description,
        });
      }
    });

    data.forEach(row => {
      // Add parent
      if (!map.has(row.Parent)) {
        const parentInfo = deityInfoFromChild.get(row.Parent) || {};
        map.set(row.Parent, {
          name: row.Parent,
          domain: parentInfo.domain,
          classification: parentInfo.classification,
          allegiance: parentInfo.allegiance,
          description: parentInfo.description,
          parents: [],
          children: []
        });
      }

      // Add child
      if (!map.has(row.Child)) {
        map.set(row.Child, {
          name: row.Child,
          domain: row.Domain,
          classification: row.Classification,
          allegiance: row.Allegiance,
          description: row.Description,
          parents: [],
          children: []
        });
      }

      // Add relationships
      const parent = map.get(row.Parent)!;
      const child = map.get(row.Child)!;

      if (!parent.children.includes(row.Child)) {
        parent.children.push(row.Child);
      }
      if (!child.parents.includes(row.Parent)) {
        child.parents.push(row.Parent);
      }

      // Update child info (in case it appears multiple times)
      if (row.Domain) child.domain = row.Domain;
      if (row.Classification) child.classification = row.Classification;
      if (row.Allegiance) child.allegiance = row.Allegiance;
      if (row.Description) child.description = row.Description;
    });

    return map;
  }, [data]);



  const handleBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousDeity = newHistory.pop()!;
      setHistory(newHistory);
      setFocusedDeity(previousDeity);
      setSelectedDeity(null); // Clear selection when going back
    }
  };

  const currentDeity = deityMap.get(focusedDeity);

  const allegianceColors: Record<string, string> = React.useMemo(() => ({
    'Benevolent': '#4ade80',
    'Neutral': '#60a5fa',
    'Malevolent': '#f87171',
    'Chaotic': '#a78bfa',
  }), []);

  const handleSelectChild = React.useCallback((childName: string) => {
    setHistory(prev => [...prev, focusedDeity]);
    setFocusedDeity(childName);
    setSelectedDeity(null); // Clear selection when drilling down
  }, [focusedDeity]);

  const handleViewDeity = React.useCallback((deityName: string) => {
    setSelectedDeity(deityName);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !currentDeity || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 700;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g');

    // Parent node position (center)
    const centerX = width / 2;
    const centerY = height / 2;

    // Children arranged in a circle around parent
    const children = currentDeity.children;
    const childCount = children.length;

    if (childCount === 0) return;

    // Radial layout - children in a circle around parent
    // Dynamic radius and node size based on child count
    const baseRadius = Math.min(width * 0.4, height * 0.4);
    const radiusAdjustment = childCount > 15 ? 1.1 : 1.0; // Bigger circle for many children
    const radius = baseRadius * radiusAdjustment;
    const childNodeRadius = childCount > 15 ? 35 : 40; // Smaller nodes for many children

    const angleStep = (Math.PI * 2) / childCount; // Full circle divided by child count

    // Calculate child positions around the circle
    const childPositions = children.map((child, i) => {
      const angle = angleStep * i - Math.PI / 2; // Start from top (-90 degrees)
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { name: child, x, y, angle };
    });

    // Draw connecting lines from parent to children
    const linkGroup = g.append('g').attr('class', 'links');

    childPositions.forEach(childPos => {
      const childInfo = deityMap.get(childPos.name);
      const color = childInfo?.allegiance
        ? allegianceColors[childInfo.allegiance] || '#999'
        : '#999';

      linkGroup.append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', childPos.x)
        .attr('y2', childPos.y)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.3)
        .attr('class', 'link');
    });

    // Draw parent node
    const parentGroup = g.append('g')
      .attr('class', 'parent-node')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    const parentColor = currentDeity.allegiance
      ? allegianceColors[currentDeity.allegiance] || '#999'
      : '#999';

    parentGroup.append('circle')
      .attr('r', 60)
      .attr('fill', parentColor)
      .attr('stroke', '#000')
      .attr('stroke-width', 4)
      .attr('opacity', 0.9);

    parentGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '18px')
      .attr('font-weight', 'bold')
      .attr('fill', '#000')
      .attr('stroke', '#fff')
      .attr('stroke-width', '3px')
      .attr('paint-order', 'stroke')
      .text(currentDeity.name);

    // Draw child nodes
    const childNodes = g.append('g').attr('class', 'child-nodes');

    childPositions.forEach(childPos => {
      const childInfo = deityMap.get(childPos.name);
      if (!childInfo) return;

      const childColor = childInfo.allegiance
        ? allegianceColors[childInfo.allegiance] || '#999'
        : '#999';

      const childGroup = childNodes.append('g')
        .attr('class', 'child-node')
        .attr('transform', `translate(${childPos.x}, ${childPos.y})`)
        .style('cursor', 'pointer')
        .on('click', () => {
          if (childInfo.children.length > 0) {
            handleSelectChild(childPos.name);
          } else {
            handleViewDeity(childPos.name);
          }
        })
        .on('mouseover', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', childNodeRadius + 5)
            .attr('stroke-width', 4);
        })
        .on('mouseout', function() {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', childNodeRadius)
            .attr('stroke-width', 2);
        });

      childGroup.append('circle')
        .attr('r', childNodeRadius)
        .attr('fill', childColor)
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
        .attr('opacity', 0.8);

      childGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('font-size', childCount > 15 ? '11px' : '13px')
        .attr('font-weight', 'bold')
        .attr('fill', '#000')
        .attr('stroke', '#fff')
        .attr('stroke-width', '3px')
        .attr('paint-order', 'stroke')
        .text(childInfo.name);

      // Show child count if they have children
      if (childInfo.children.length > 0) {
        childGroup.append('circle')
          .attr('cx', 25)
          .attr('cy', -25)
          .attr('r', 12)
          .attr('fill', '#fff')
          .attr('stroke', '#000')
          .attr('stroke-width', 2);

        childGroup.append('text')
          .attr('x', 25)
          .attr('y', -25)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .attr('font-size', '10px')
          .attr('font-weight', 'bold')
          .attr('fill', '#000')
          .text(childInfo.children.length);
      }
    });

  }, [focusedDeity, currentDeity, allegianceColors, deityMap, handleSelectChild, handleViewDeity]);

  const allegianceColorClasses: Record<string, string> = {
    'Benevolent': 'bg-green-100 border-green-300 text-green-900',
    'Neutral': 'bg-blue-100 border-blue-300 text-blue-900',
    'Malevolent': 'bg-red-100 border-red-300 text-red-900',
    'Chaotic': 'bg-purple-100 border-purple-300 text-purple-900',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          onClick={handleBack}
          disabled={history.length === 0}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="text-sm text-foreground/70 ml-2">
          {history.length > 0 && `Depth: ${history.length + 1}`}
        </div>
      </div>

      {/* How to Navigate Instructions */}
      <div className="p-3 bg-muted/50 rounded-lg border">
        <p className="text-sm font-semibold mb-1">💡 How to Navigate</p>
        <p className="text-sm text-foreground/80">
          Click any child node to view its description. Nodes with number badges can be explored further to see their descendants.
          Use the Back button to navigate up the family tree.
        </p>
      </div>

      {/* Main Layout: Graph (2/3) + Info Card (1/3) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* D3 Visualization - 2/3 width on large screens */}
        <div ref={containerRef} className="flex-1 lg:w-2/3 border border-border rounded-lg bg-background p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold">
              {currentDeity?.name} and their Children ({currentDeity?.children.length || 0})
            </h3>
          </div>
          <svg ref={svgRef} className="w-full" />
        </div>

        {/* Information Card - 1/3 width on large screens */}
        {currentDeity && (
          <div className="lg:w-1/3 flex flex-col gap-4">
            {(() => {
              const displayDeity = selectedDeity ? deityMap.get(selectedDeity) : currentDeity;
              if (!displayDeity) return null;

              const isSelected = selectedDeity !== null;

              return (
                <Card className={`border-2 flex-1 ${displayDeity.allegiance ? allegianceColorClasses[displayDeity.allegiance] : 'bg-gray-100 border-gray-300'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{displayDeity.name}</span>
                      <span className="text-sm font-normal text-foreground/60">
                        {isSelected ? 'Selected' : 'Current Focus'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {displayDeity.description && (
                      <div className="pb-2 mb-2 border-b italic text-foreground/80 whitespace-pre-line">
                        {displayDeity.description.replace(/\\n/g, '\n')}
                      </div>
                    )}
                    {displayDeity.classification && (
                      <div>
                        <span className="font-semibold">Type:</span> {displayDeity.classification}
                      </div>
                    )}
                    {displayDeity.domain && (
                      <div>
                        <span className="font-semibold">Domain:</span> {displayDeity.domain}
                      </div>
                    )}
                    {displayDeity.parents.length > 0 && (
                      <div>
                        <span className="font-semibold">Parents:</span>{' '}
                        {displayDeity.parents.join(', ')}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold">Children:</span> {displayDeity.children.length}
                    </div>
                    {isSelected && displayDeity.children.length > 0 && (
                      <Button
                        onClick={() => handleSelectChild(displayDeity.name)}
                        variant="default"
                        size="sm"
                        className="w-full mt-2"
                      >
                        Explore {displayDeity.name}&apos;s Children
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Legend */}
            <div className="flex flex-wrap gap-3 p-4 bg-muted rounded-lg text-sm">
              <div className="font-bold w-full">Legend:</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span>Benevolent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span>Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span>Malevolent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <span>Chaotic</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineageExplorer;
