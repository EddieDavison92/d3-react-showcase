"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Users, ArrowDown } from 'lucide-react';

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

interface GenerationalExplorerProps {
  data: RawDataRow[];
}

const GenerationalExplorer: React.FC<GenerationalExplorerProps> = ({ data }) => {
  const [focusedDeity, setFocusedDeity] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([]);

  // Build deity information map
  const deityMap = new Map<string, DeityInfo>();

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
    if (!deityMap.has(row.Parent)) {
      const parentInfo = deityInfoFromChild.get(row.Parent) || {};
      deityMap.set(row.Parent, {
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
    if (!deityMap.has(row.Child)) {
      deityMap.set(row.Child, {
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
    const parent = deityMap.get(row.Parent)!;
    const child = deityMap.get(row.Child)!;

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

  const handleSelectDeity = (deityName: string) => {
    setHistory([...history, focusedDeity]);
    setFocusedDeity(deityName);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousDeity = newHistory.pop()!;
      setHistory(newHistory);
      setFocusedDeity(previousDeity);
    }
  };

  const handleReset = () => {
    setHistory([]);
    setFocusedDeity(null);
  };

  const allegianceColors: Record<string, string> = {
    'Benevolent': 'bg-green-100 border-green-300 text-green-900',
    'Neutral': 'bg-blue-100 border-blue-300 text-blue-900',
    'Malevolent': 'bg-red-100 border-red-300 text-red-900',
    'Chaotic': 'bg-purple-100 border-purple-300 text-purple-900',
  };

  const renderDeityCard = (deityName: string, isParent: boolean = false) => {
    const deity = deityMap.get(deityName);
    if (!deity) return null;

    const colorClass = deity.allegiance
      ? allegianceColors[deity.allegiance] || 'bg-gray-100 border-gray-300'
      : 'bg-gray-100 border-gray-300';

    return (
      <Card
        key={deityName}
        className={`${colorClass} border-2 transition-all hover:shadow-lg ${
          isParent ? 'ring-4 ring-primary ring-offset-2' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {deity.name}
            {isParent && <span className="ml-2 text-sm font-normal text-muted-foreground">(Parent)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {deity.description && (
            <div className="pb-2 mb-2 border-b italic text-muted-foreground">
              {deity.description}
            </div>
          )}
          {deity.classification && (
            <div>
              <span className="font-semibold">Type:</span> {deity.classification}
            </div>
          )}
          {deity.domain && (
            <div>
              <span className="font-semibold">Domain:</span> {deity.domain}
            </div>
          )}
          {deity.parents.length > 0 && !isParent && (
            <div>
              <span className="font-semibold">Parents:</span>{' '}
              {deity.parents.join(', ')}
            </div>
          )}
          {deity.children.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Users className="w-4 h-4" />
              <span className="font-semibold">
                {deity.children.length} {deity.children.length === 1 ? 'child' : 'children'}
              </span>
            </div>
          )}
          {deity.children.length > 0 && !isParent && (
            <Button
              onClick={() => handleSelectDeity(deityName)}
              variant="outline"
              size="sm"
              className="w-full mt-2"
            >
              Explore Children
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  // Get primordial beings (those with no parents)
  const primordialBeings = Array.from(deityMap.values())
    .filter(deity => deity.parents.length === 0)
    .map(deity => deity.name);

  const currentDeity = focusedDeity ? deityMap.get(focusedDeity) : null;

  return (
    <div className="space-y-6">
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
        <Button
          onClick={handleReset}
          variant="outline"
          size="sm"
        >
          Reset to Start
        </Button>
        <div className="text-sm text-muted-foreground ml-2">
          {history.length > 0 && `Depth: ${history.length}`}
        </div>
      </div>

      {!focusedDeity ? (
        // Show primordial beings
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Primordial Beings</h3>
            <p className="text-sm text-muted-foreground">
              Select a deity to explore their children and descendants
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {primordialBeings.map(deityName => renderDeityCard(deityName))}
          </div>
        </div>
      ) : (
        // Show focused deity and their children
        <div className="space-y-6">
          {/* Parent section */}
          <div className="space-y-3">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Parent</h3>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                {renderDeityCard(focusedDeity, true)}
              </div>
            </div>
          </div>

          {/* Arrow indicator */}
          {currentDeity && currentDeity.children.length > 0 && (
            <div className="flex justify-center">
              <ArrowDown className="w-8 h-8 text-muted-foreground animate-bounce" />
            </div>
          )}

          {/* Children section */}
          {currentDeity && currentDeity.children.length > 0 ? (
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">
                  Children ({currentDeity.children.length})
                </h3>
                <p className="text-sm text-muted-foreground">
                  These are all siblings - children of {currentDeity.name}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentDeity.children.map(childName => renderDeityCard(childName))}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                {currentDeity?.name} has no recorded children in this dataset.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerationalExplorer;
