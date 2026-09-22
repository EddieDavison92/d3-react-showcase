"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type { FeatureCollection, Feature } from "geojson"
import { colourLookup } from "@/components/explorer/map-helpers"
import { TEAL_RAMP } from "@/lib/explorer/colours"
import { areasForGeo, geoUrl, loadLe } from "@/lib/explorer/data"
import { deriveMap } from "@/lib/explorer/derive"
import { exploreHref } from "@/lib/explorer/url-state"
import Link from "next/link"

const ChoroplethMap = dynamic(
  () => import("@/components/explorer/ChoroplethMap").then((mod) => mod.ChoroplethMap),
  { ssr: false, loading: () => <div className="h-full animate-pulse bg-[#f8fafc]" /> }
)

export function HeroMap() {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)
  const [colours, setColours] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    Promise.all([loadLe(), fetch(geoUrl("ltla")).then((res) => {
      if (!res.ok) throw new Error("geo")
      return res.json() as Promise<FeatureCollection>
    })])
      .then(([file, raw]) => {
        if (cancelled) return
        const areas = areasForGeo(file, "ltla", "le")
        const allowed = new Set(areas.map((area) => area.code))
        const periodIndex = Math.max(0, file.periods.indexOf("2022 to 2024"))
        const derived = deriveMap({
          view: "absolute",
          file,
          areas,
          metric: "le",
          sex: "Male",
          age: "birth",
          periodIndex,
        })
        const values: Record<string, number | null> = {}
        for (const [code, cell] of Object.entries(derived)) values[code] = cell.value
        setColours(colourLookup(values, TEAL_RAMP, false).colours)
        setGeojson({
          type: "FeatureCollection",
          features: raw.features.filter((feature) =>
            allowed.has(String(feature.properties?.code ?? ""))
          ) as Feature[],
        })
      })
      .catch(() => {
        if (!cancelled) setGeojson(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const emptyHover = useMemo(() => () => "", [])

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(204,251,241,0.35),transparent_70%)]" />
      <div className="relative h-[42vh] max-h-[22rem] w-full lg:h-[min(68vh,36rem)] lg:max-h-none">
        {geojson ? (
          <ChoroplethMap
            geojson={geojson}
            colours={colours}
            selected={null}
            onSelect={() => undefined}
            formatHover={emptyHover}
            interactive={false}
            enterMs={700}
          />
        ) : (
          <div className="relative h-full animate-pulse bg-[#f8fafc]">
            <div className="absolute inset-[14%] rounded-[42%] border border-slate-300/80" />
          </div>
        )}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        2022–24 · Male · at birth · Absolute{" "}
        <Link href={exploreHref()} className="text-teal-800 underline-offset-2 hover:underline">
          Explore this cut →
        </Link>
      </p>
    </div>
  )
}
