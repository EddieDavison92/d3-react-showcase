"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { FeatureCollection } from "geojson"
import { NO_DATA } from "@/lib/explorer/colours"

type HoverInfo = { code: string; name: string; x: number; y: number }

export function ChoroplethMap({
  geojson,
  colours,
  selected,
  onSelect,
  formatHover,
}: {
  geojson: FeatureCollection
  colours: Record<string, string>
  selected: string | null
  onSelect: (code: string) => void
  formatHover: (code: string, name: string) => string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const coloursRef = useRef(colours)
  const selectedRef = useRef(selected)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    coloursRef.current = colours
    selectedRef.current = selected
  }, [colours, selected])

  useEffect(() => {
    if (!containerRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#f8fafc" },
          },
        ],
      },
      bounds: [
        [-8.6, 49.8],
        [1.9, 59.5],
      ],
      fitBoundsOptions: { padding: 16 },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    mapRef.current = map

    map.on("load", () => {
      map.addSource("areas", {
        type: "geojson",
        data: geojson,
        promoteId: "code",
      })
      map.addLayer({
        id: "fill",
        type: "fill",
        source: "areas",
        paint: {
          "fill-color": [
            "to-color",
            ["coalesce", ["feature-state", "colour"], NO_DATA],
          ],
          "fill-opacity": 0.92,
        },
      })
      map.addLayer({
        id: "line",
        type: "line",
        source: "areas",
        paint: {
          "line-color": "#0f172a",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            1.8,
            0.3,
          ],
          "line-opacity": 0.55,
        },
      })
      paint(map, geojson, coloursRef.current, selectedRef.current)

      map.on("mousemove", "fill", (event) => {
        map.getCanvas().style.cursor = "pointer"
        const feature = event.features?.[0]
        const code = String(feature?.properties?.code ?? "")
        const name = String(feature?.properties?.name ?? "")
        if (!code) return
        setHover({ code, name, x: event.point.x, y: event.point.y })
      })
      map.on("mouseleave", "fill", () => {
        map.getCanvas().style.cursor = ""
        setHover(null)
      })
      map.on("click", "fill", (event) => {
        const code = String(event.features?.[0]?.properties?.code ?? "")
        if (code) onSelectRef.current(code)
      })
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // geojson identity is keyed by the parent; recreate the map when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    paint(map, geojson, colours, selected)
  }, [colours, selected, geojson])

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-lg border bg-slate-50">
      <div ref={containerRef} className="h-full w-full" />
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 max-w-xs whitespace-pre-wrap rounded-md border bg-popover px-2 py-1.5 text-xs shadow"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          {formatHover(hover.code, hover.name)}
        </div>
      ) : null}
    </div>
  )
}

function paint(
  map: maplibregl.Map,
  geojson: FeatureCollection,
  colours: Record<string, string>,
  selected: string | null
) {
  if (!map.getSource("areas")) return
  for (const feature of geojson.features) {
    const code = String(feature.properties?.code ?? "")
    if (!code) continue
    map.setFeatureState(
      { source: "areas", id: code },
      { colour: colours[code] ?? NO_DATA, selected: code === selected }
    )
  }
}
