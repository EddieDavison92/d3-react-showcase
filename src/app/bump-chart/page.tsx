"use client";

import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import BumpChart from '@/components/d3/BumpChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  useEffect(() => {
    d3.json('/data/stackoverflow-survey-trends.json').then((jsonData: any) => {
      setData(jsonData as TechTrendsData);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-muted-foreground">Loading Stack Overflow survey data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Developer Technology Trends</h1>
        <p className="text-lg text-muted-foreground">
          Explore technology adoption trends from the Stack Overflow Annual Developer Survey (2022-2025)
        </p>
      </div>

      <Tabs defaultValue={data.categories[0].name} className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-5">
          {data.categories.map(category => (
            <TabsTrigger key={category.name} value={category.name}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {data.categories.map(category => (
          <TabsContent key={category.name} value={category.name}>
            <Card>
              <CardHeader>
                <CardTitle>{category.name} Trends</CardTitle>
                <CardDescription>
                  Year-over-year trends in {category.name.toLowerCase()} adoption ({data.years[0]}-{data.years[data.years.length - 1]})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BumpChart data={data} categoryName={category.name} width={1200} height={700} topN={12} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>About This Visualisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              This interactive multi-line chart shows how developer technology preferences have evolved
              over the past four years based on the Stack Overflow Annual Developer Survey.
            </p>
            <div>
              <h4 className="font-semibold mb-1">Key Insights:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Python:</strong> Jumped 7% from 2024 to 2025 (50.9% → 57.9%)</li>
                <li><strong>Docker:</strong> Massive 17-point surge in 2025 (54.1% → 71.1%)</li>
                <li><strong>AI Explosion:</strong> GPT went from 12.4% (2022) to 81.4% (2025)</li>
                <li><strong>Claude:</strong> Skyrocketed from 8.2% (2023) to 42.8% (2025)</li>
                <li><strong>Cursor IDE:</strong> 0% to 17.9% in just one year</li>
                <li><strong>Next.js:</strong> Nearly doubled from 11.8% to 20.8%</li>
                <li><strong>PostgreSQL:</strong> Overtook MySQL (55.6% vs 40.5%)</li>
                <li><strong>Go & Rust:</strong> Steady growth year-over-year</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dataset Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-muted rounded">
                <div className="text-2xl font-bold">{data.categories.length}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-2xl font-bold">
                  {data.categories.reduce((sum, cat) => sum + cat.technologies.length, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Technologies</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-2xl font-bold">{data.years.length}</div>
                <div className="text-xs text-muted-foreground">Years</div>
              </div>
              <div className="p-3 bg-muted rounded">
                <div className="text-2xl font-bold">49,000+</div>
                <div className="text-xs text-muted-foreground">2025 Responses</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded">
              <p className="text-xs">
                <strong>Source:</strong> {data.metadata.source}
              </p>
              <p className="text-xs mt-1">
                <strong>Attribution:</strong> {data.metadata.attribution}
              </p>
              <p className="text-xs mt-1">
                <a
                  href={data.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Visit survey data →
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
