// src/utils/aggregateData.ts

import * as d3 from "d3";

export interface DataElement {
  Period: Date; // Ensure Period is always a Date
  "Org name": string;
  "A&E Attendances": number;
}

export function aggregateData(data: any[], measures: string[]): DataElement[] {
  const parseDate = d3.timeParse("%Y-%m-%d");

  const filteredData = data.filter(d => d["Parent Org"] === "NHS ENGLAND LONDON");

  const aggregatedData = d3.rollup(
    filteredData,
    (v) => {
      const result: DataElement = {
        Period: parseDate(v[0].Period as string) as Date,
        "Org name": v[0]["Org name"],
        "A&E Attendances": d3.sum(v, d => (+d["A&E attendances Type 1"] || 0) + (+d["A&E attendances Type 2"] || 0) + (+d["A&E attendances Other A&E Department"] || 0)),
      };
      return result;
    },
    d => `${parseDate(d.Period as string)?.getTime()}-${d["Org name"]}`
  );

  const aggregatedArray = Array.from(aggregatedData.values());
  aggregatedArray.sort((a, b) => a.Period.getTime() - b.Period.getTime());

  return aggregatedArray;
}
