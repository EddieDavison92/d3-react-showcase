"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { FeatureCollection } from "geojson"
import { boundsOfGeojson } from "@/components/explorer/map-helpers"
import { NO_DATA } from "@/lib/explorer/colours"

type HoverInfo = { code: string; name: string; x: number; y: number }

const UK_BOUNDS: [[number, number], [number, number]] = [
  [-8.6, 49.8],
  [1.9, 59.5],
]

const MIN_SIZE = 24

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
    const el = containerRef.current
    if (!el) return
    let map: maplibregl.Map | null = null
    let userMoved = false
    let fitting = false
    let cancelled = false
    const featureBounds = boundsOfGeojson(geojson) ?? UK_BOUNDS

    const fit = () => {
      if (!map || userMoved || cancelled) return
      map.resize()
      if (el.clientWidth < MIN_SIZE || el.clientHeight < MIN_SIZE) return
      const bounds = boundsOfGeojson(geojson) ?? UK_BOUNDS
      fitting = true
      map.fitBounds(bounds, { padding: 28, duration: 0, maxZoom: 8 })
      map.once("idle", () => {
        fitting = false
      })
    }

    const markUserMoved = (event: { originalEvent?: Event }) => {
      if (fitting || !event.originalEvent) return
      userMoved = true
    }

    const attach = () => {
      if (!map?.getSource("areas")) return
      paint(map, geojson, coloursRef.current, selectedRef.current)
      fit()
    }

    const create = () => {
      if (map || cancelled || el.clientWidth < MIN_SIZE || el.clientHeight < MIN_SIZE) return
      map = new maplibregl.Map({
        container: el,
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
        bounds: featureBounds,
        fitBoundsOptions: { padding: 28, duration: 0 },
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: false,
        trackResize: true,
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
      mapRef.current = map
      map.on("dragstart", markUserMoved)
      map.on("zoomstart", markUserMoved)
      map.on("boxzoomstart", markUserMoved)

      map.on("load", () => {
        if (!map || cancelled) return
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
              0.35,
            ],
            "line-opacity": 0.55,
          },
        })
        attach()
        map.on("mousemove", "fill", (event) => {
          map!.getCanvas().style.cursor = "pointer"
          const feature = event.features?.[0]
          const code = String(feature?.properties?.code ?? "")
          const name = String(feature?.properties?.name ?? "")
          if (!code) return
          setHover({ code, name, x: event.point.x, y: event.point.y })
        })
        map.on("mouseleave", "fill", () => {
          map!.getCanvas().style.cursor = ""
          setHover(null)
        })
        map.on("click", "fill", (event) => {
          const code = String(event.features?.[0]?.properties?.code ?? "")
          if (code) onSelectRef.current(code)
        })
      })
    }

    const onViewport = () => {
      create()
      map?.resize()
      if (map?.isStyleLoaded()) attach()
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
      onViewport()
    })
    observer.observe(el)
    window.visualViewport?.addEventListener("resize", onViewport)
    window.addEventListener("orientationchange", onViewport)
    create()
    const raf = requestAnimationFrame(() => {
      create()
      if (map?.isStyleLoaded()) fit()
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.visualViewport?.removeEventListener("resize", onViewport)
      window.removeEventListener("orientationchange", onViewport)
      map?.remove()
      mapRef.current = null
    }
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
    <div className="relative h-full min-h-[240px] w-full max-w-full overflow-hidden rounded-lg border bg-slate-50">
      <div ref={containerRef} className="absolute inset-0 h-full w-full max-w-full" />
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
