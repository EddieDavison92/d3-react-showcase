'use client';

import React, { useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import TemperatureAnomalyHeatmap from '@/components/d3/TemperatureAnomalyHeatmap';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { DownloadIcon } from '@radix-ui/react-icons';
import { VisualizationLayout } from '@/components/layouts/VisualizationLayout';
import { VisualizationSidebarSection } from '@/components/ui/visualization-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
    Year: number;
    Anomaly: number | null;
    YearFloor: number;
    MonthIndex: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const colorScale = d3.scaleSequential(d3.interpolateRdYlBu).domain([3, -3]);

const exportToCSV = (data: DataPoint[]) => {
    const headers = ['Year', 'Month', 'Anomaly'];
    const rows = data.map(d => [
        d.YearFloor,
        MONTHS[d.MonthIndex],
        d.Anomaly?.toFixed(2)
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'temperature_anomalies.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const DataTable: React.FC<{ brushedData: DataPoint[] }> = ({ brushedData }) => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Anomaly (°C)</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {brushedData.map((d, i) => (
                <TableRow key={i}>
                    <TableCell className="font-medium">{d.YearFloor}</TableCell>
                    <TableCell>{MONTHS[d.MonthIndex]}</TableCell>
                    <TableCell>{d.Anomaly?.toFixed(2)}</TableCell>
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

export default function Home() {
    const [data, setData] = useState<DataPoint[]>([]);
    const [brushedData, setBrushedData] = useState<DataPoint[]>([]);
    const [isBrushed, setIsBrushed] = useState(false);
    const [enableBrushing, setEnableBrushing] = useState(false);
    const [maxYear, setMaxYear] = useState<number | null>(null);
    const [maxMonth, setMaxMonth] = useState<string | null>(null);

    const handleSetBrushedData = useCallback((newData: DataPoint[] | ((prevState: DataPoint[]) => DataPoint[])) => {
        setBrushedData(newData);
    }, []);

    const handleSetIsBrushed = useCallback((value: boolean | ((prevState: boolean) => boolean)) => {
        setIsBrushed(value);
    }, []);

    useEffect(() => {
        fetch('/data/gisstemp_anomaly_jun24.json')
            .then(response => response.json())
            .then(rawData => {
                const formattedData: DataPoint[] = rawData.map((d: { Year: string; Anomaly: string }) => {
                    const year = parseFloat(d.Year);
                    const yearFloor = Math.floor(year);
                    const monthIndex = Math.floor((year - yearFloor) * 12);
                    return {
                        Year: year,
                        Anomaly: parseFloat(d.Anomaly),
                        YearFloor: yearFloor,
                        MonthIndex: monthIndex
                    };
                });

                setData(formattedData);

                // Calculate max year and month
                const maxYearData = Math.max(...formattedData.map(d => d.Year));
                const maxMonthIndex = Math.max(...formattedData.filter(d => d.Year === maxYearData).map(d => d.MonthIndex));
                setMaxYear(Math.floor(maxYearData));
                setMaxMonth(MONTHS[maxMonthIndex]);
            });
    }, []);

    useEffect(() => {
        if (!enableBrushing) {
            setIsBrushed(false);
            setBrushedData([]);
        }
    }, [enableBrushing]);

    const sidebarContent = (
        <>
            <VisualizationSidebarSection title="About">
                <Card>
                    <CardContent className="p-4 space-y-2 text-sm">
                        <p className="text-muted-foreground">
                            This heatmap illustrates global temperature anomalies from January to December for each year since 1880.
                        </p>
                        <p className="text-muted-foreground">
                            The data, provided by NASA&apos;s GISS Surface Temperature Analysis (GISTEMP), is color-coded from blue to red,
                            representing the transition from colder to warmer anomalies.
                        </p>
                        <p className="text-muted-foreground">
                            Anomalies are calculated relative to the base period of 1980-2015.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Most recent data: {maxMonth} {maxYear}
                        </p>
                        <a
                            href="https://data.giss.nasa.gov/gistemp/"
                            target="_blank"
                            className="text-primary hover:underline text-xs block mt-2"
                        >
                            Visit NASA GISS page →
                        </a>
                    </CardContent>
                </Card>
            </VisualizationSidebarSection>

            <VisualizationSidebarSection title="Controls">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Enable Brushing</label>
                            <Switch checked={enableBrushing} onCheckedChange={setEnableBrushing} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Brush over the heatmap and legend to highlight specific periods and anomalies
                        </p>
                    </CardContent>
                </Card>
            </VisualizationSidebarSection>

            {isBrushed && (
                <VisualizationSidebarSection title="Selected Data">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm">Temperature Anomalies</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-3">
                            <Button className="w-full" onClick={() => exportToCSV(brushedData)}>
                                <DownloadIcon className="mr-2 h-4 w-4" />
                                Export to CSV
                            </Button>
                            <div className="max-h-[300px] overflow-auto">
                                <DataTable brushedData={brushedData} />
                            </div>
                        </CardContent>
                    </Card>
                </VisualizationSidebarSection>
            )}
        </>
    );

    return (
        <VisualizationLayout
            title="Temperature Anomaly Heatmap"
            description="Explore global temperature anomalies since 1880 with interactive brushing"
            sidebarContent={sidebarContent}
            sidebarDefaultOpen={true}
        >
            <TemperatureAnomalyHeatmap
                data={data}
                enableBrushing={enableBrushing}
                setBrushedData={handleSetBrushedData}
                setIsBrushed={handleSetIsBrushed}
                colorScale={colorScale}
                months={MONTHS}
            />
        </VisualizationLayout>
    );
}
