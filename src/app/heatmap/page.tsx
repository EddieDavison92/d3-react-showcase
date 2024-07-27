'use client';

import React, { useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import TemperatureAnomalyHeatmap from '@/components/d3/TemperatureAnomalyHeatmap';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from "@/components/ui/button";
import { DownloadIcon } from '@radix-ui/react-icons';

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

    return (
        <div className="p-4 max-w-6xl mx-auto justify-center">
            <h1 className="text-2xl font-semibold mt-4 mb-4 text-left">Temperature Anomaly Heatmap</h1>
            <p className="mb-4">
                This heatmap illustrates global temperature anomalies from January to December for each year since 1880. 
                The data, provided by NASA&apos;s GISS Surface Temperature Analysis (GISTEMP), is color-coded from blue to red, 
                representing the transition from colder to warmer anomalies. The anomalies are calculated relative to the 
                base period of 1980-2015.
            </p>
            <p className="mb-4">The most recent data available is from {maxMonth} {maxYear}. For more details and data, visit the 
                <a href="https://data.giss.nasa.gov/gistemp/" target="_blank" className="font-medium text-primary underline underline-offset-4">{" "}NASA GISS page</a>.
            </p>
            <p className="mb-4">
                You can brush over the heatmap and the legend to highlight and focus on particular periods and anomalies.
            </p>
            <div className="mb-4 flex items-center">
                <label className="mr-2 font-semibold">Enable Brushing</label>
                <Switch checked={enableBrushing} onCheckedChange={setEnableBrushing} />
            </div>
            <TemperatureAnomalyHeatmap 
                data={data} 
                enableBrushing={enableBrushing} 
                setBrushedData={handleSetBrushedData} 
                setIsBrushed={handleSetIsBrushed} 
                colorScale={colorScale}
                months={MONTHS}
            />
            {isBrushed && (
                <div className="max-w-[350px] mt-4">
                    <h2 className="text-lg font-bold mb-2">Selected Temperature Anomalies</h2>
                    <Button className="mb-2" onClick={() => exportToCSV(brushedData)}>
                        < DownloadIcon className="mr-2 h-4 w-4" />
                        {" "}Export to CSV
                    </Button>
                    <DataTable brushedData={brushedData} />
                </div>
            )}
        </div>
    );
}
