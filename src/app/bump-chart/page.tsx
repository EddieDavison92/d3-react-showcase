"use client";

import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import BumpChart from '@/components/d3/BumpChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisualizationLayout } from '@/components/layouts/VisualizationLayout';
import { VisualizationSidebarSection } from '@/components/ui/visualization-sidebar';
import { Button } from '@/components/ui/button';

interface Technology {
  name: string;
  values: number[];
}

interface Category {
  name: string;
  technologies: Technology[];
}

interface TechTrendsData {
  metadata: {
    source: string;
    attribution: string;
    url: string;
    description: string;
  };
  years: string[];
  categories: Category[];
}

export default function TechTrendsPage() {
  const [data, setData] = useState<TechTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    d3.json('/data/stackoverflow-survey-trends.json').then((jsonData: any) => {
      const typedData = jsonData as TechTrendsData;
      setData(typedData);
      setSelectedCategory(typedData.categories[0].name);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-muted-foreground">Loading Stack Overflow survey data...</p>
      </div>
    );
  }

  const selectedCategoryData = data.categories.find(c => c.name === selectedCategory);

  const sidebarContent = (
    <>
      <VisualizationSidebarSection title="Categories">
        <div className="space-y-2">
          {data.categories.map(category => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </VisualizationSidebarSection>

      <VisualizationSidebarSection title="About">
        <Card>
          <CardContent className="p-4 space-y-3 text-sm">
            <p className="text-muted-foreground">
              This interactive bump chart shows how developer technology preferences have evolved
              over the past four years based on the Stack Overflow Annual Developer Survey.
            </p>
            <div>
              <h4 className="font-semibold mb-1">Key Insights:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                <li><strong>Python:</strong> Jumped 7% (50.9% → 57.9%)</li>
                <li><strong>Docker:</strong> 17-point surge in 2025</li>
                <li><strong>AI Explosion:</strong> GPT 12.4% → 81.4%</li>
                <li><strong>Claude:</strong> 8.2% → 42.8%</li>
                <li><strong>Cursor IDE:</strong> 0% → 17.9%</li>
                <li><strong>PostgreSQL:</strong> Overtook MySQL</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>

      <VisualizationSidebarSection title="Dataset">
        <Card>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-muted rounded">
                <div className="text-xl font-bold">{data.categories.length}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-xl font-bold">
                  {data.categories.reduce((sum, cat) => sum + cat.technologies.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Technologies</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-xl font-bold">{data.years.length}</div>
                <div className="text-xs text-muted-foreground">Years</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-xl font-bold">49k+</div>
                <div className="text-xs text-muted-foreground">Responses</div>
              </div>
            </div>
            <div className="p-2 bg-muted rounded text-xs">
              <p className="mb-1">
                <strong>Source:</strong> {data.metadata.source}
              </p>
              <a
                href={data.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Visit survey data →
              </a>
            </div>
          </CardContent>
        </Card>
      </VisualizationSidebarSection>
    </>
  );

  return (
    <VisualizationLayout
      title="Developer Technology Trends"
      description={`Explore technology adoption trends from the Stack Overflow Annual Developer Survey (${data.years[0]}-${data.years[data.years.length - 1]})`}
      sidebarContent={sidebarContent}
      sidebarDefaultOpen={true}
    >
      {selectedCategoryData && (
        <Card className="max-w-7xl mx-auto">
          <CardHeader>
            <CardTitle>{selectedCategoryData.name} Trends</CardTitle>
            <CardDescription>
              Year-over-year trends in {selectedCategoryData.name.toLowerCase()} adoption ({data.years[0]}-{data.years[data.years.length - 1]})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BumpChart
              data={data}
              categoryName={selectedCategoryData.name}
              width={1200}
              height={700}
              topN={12}
            />
          </CardContent>
        </Card>
      )}
    </VisualizationLayout>
  );
}
