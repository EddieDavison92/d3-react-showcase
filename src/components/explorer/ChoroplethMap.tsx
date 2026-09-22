"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { FeatureCollection } from "geojson"
import { boundsOfGeojson } from "@/components/explorer/map-helpers"
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
  const [size, setSize] = useState({ width: 320, height: 240 })

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
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: false,
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    mapRef.current = map

    let fitted = false
    const fitIfSized = () => {
      map.resize()
      const canvas = map.getCanvas()
      if (canvas.width < 8 || canvas.height < 8) return
      if (fitted) return
      const bounds = boundsOfGeojson(geojson) ?? [
        [-8.6, 49.8],
        [1.9, 59.5],
      ]
      map.fitBounds(bounds, { padding: 20, duration: 0 })
      fitted = true
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
      if (map.isStyleLoaded()) fitIfSized()
      else map.resize()
    })
    observer.observe(containerRef.current)

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
      fitIfSized()

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
      observer.disconnect()
      map.remove()
      mapRef.current = null
    }
    // Recreate the map when the parent passes a new geojson identity.
  }, [geojson])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    paint(map, geojson, colours, selected)
  }, [colours, selected, geojson])

  const tooltipStyle = hover
    ? {
        left: Math.max(8, Math.min(hover.x + 12, size.width - 168)),
        top: Math.max(8, Math.min(hover.y + 12, size.height - 80)),
      }
    : undefined

  return (
    <div className="relative h-full min-h-[220px] w-full overflow-hidden rounded-lg border bg-slate-50">
      <div ref={containerRef} className="absolute inset-0" />
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 max-w-[min(100%-1rem,18rem)] whitespace-pre-wrap rounded-md border bg-popover px-2 py-1.5 text-xs shadow"
          style={tooltipStyle}
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
