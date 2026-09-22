"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { FeatureCollection } from "geojson"
import { boundsOfGeojson } from "@/components/explorer/map-helpers"
import { mixColour, motionMs, NO_DATA } from "@/lib/explorer/colours"
import { buildHexField } from "@/lib/explorer/hex-field"
import { cn } from "@/lib/utils"

type HoverInfo = { code: string; name: string; x: number; y: number }

const UK_BOUNDS: [[number, number], [number, number]] = [
  [-8.6, 49.8],
  [1.9, 59.5],
]

const MIN_SIZE = 24
const INTERNAL_STROKE = "#94a3b8"
const COAST_STROKE = "#475569"

export function ChoroplethMap({
  geojson,
  colours,
  hatch,
  selected,
  onSelect,
  formatHover,
  interactive = true,
  year,
  view,
  enterMs = 0,
  quietHover = false,
  className,
}: {
  geojson: FeatureCollection
  colours: Record<string, string>
  hatch?: Record<string, boolean>
  selected: string | null
  onSelect: (code: string) => void
  formatHover: (code: string, name: string) => string
  interactive?: boolean
  year?: string
  view?: string
  enterMs?: number
  quietHover?: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const coloursRef = useRef(colours)
  const hatchRef = useRef(hatch)
  const selectedRef = useRef(selected)
  const cueRef = useRef({ year, view })
  const paintedRef = useRef<Record<string, string>>({})
  const rafRef = useRef(0)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [size, setSize] = useState({ width: 320, height: 240 })
  const [ready, setReady] = useState(false)
  const hexField = useMemo(() => buildHexField(geojson), [geojson])

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    coloursRef.current = colours
    hatchRef.current = hatch
    selectedRef.current = selected
  }, [colours, hatch, selected])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let map: maplibregl.Map | null = null
    let userMoved = false
    let fitting = false
    let cancelled = false
    const featureBounds = boundsOfGeojson(geojson) ?? UK_BOUNDS
    const padding = interactive ? 28 : 36

    const fit = () => {
      if (!map || userMoved || cancelled) return
      map.resize()
      if (el.clientWidth < MIN_SIZE || el.clientHeight < MIN_SIZE) return
      const bounds = boundsOfGeojson(geojson) ?? UK_BOUNDS
      fitting = true
      map.fitBounds(bounds, { padding, duration: 0, maxZoom: 8 })
      map.once("idle", () => {
        fitting = false
        setReady(true)
      })
    }

    const markUserMoved = (event: { originalEvent?: Event }) => {
      if (fitting || !event.originalEvent) return
      userMoved = true
    }

    const attach = () => {
      if (!map?.getSource("hex")) return
      paint(map, hexField, coloursRef.current, selectedRef.current, hatchRef.current)
      paintedRef.current = coloursRef.current
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
        fitBoundsOptions: { padding, duration: 0 },
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: false,
        trackResize: true,
        interactive,
      })
      if (interactive) {
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right")
        map.on("dragstart", markUserMoved)
        map.on("zoomstart", markUserMoved)
        map.on("boxzoomstart", markUserMoved)
      }
      mapRef.current = map

      map.on("load", () => {
        if (!map || cancelled) return
        if (!map.hasImage("ci-hatch")) {
          map.addImage("ci-hatch", hatchPattern())
        }
        map.addSource("coast", {
          type: "geojson",
          data: geojson,
        })
        map.addLayer({
          id: "land",
          type: "fill",
          source: "coast",
          paint: {
            "fill-color": "#e2e8f0",
            "fill-opacity": 0.16,
          },
        })
        map.addLayer({
          id: "coast",
          type: "line",
          source: "coast",
          layout: { "line-join": "round" },
          paint: {
            "line-color": COAST_STROKE,
            "line-width": 0.9,
            "line-opacity": 0.4,
          },
        })
        map.addSource("hex", {
          type: "geojson",
          data: hexField,
          promoteId: "id",
        })
        map.addLayer({
          id: "hex-shadow",
          type: "fill",
          source: "hex",
          paint: {
            "fill-color": "#64748b",
            "fill-opacity": 0.12,
            "fill-translate": [1.2, 1.5],
          },
        })
        map.addLayer({
          id: "fill",
          type: "fill",
          source: "hex",
          paint: {
            "fill-color": [
              "to-color",
              ["coalesce", ["feature-state", "colour"], NO_DATA],
            ],
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hatch"], false],
              0.58,
              0.96,
            ],
          },
        })
        map.addLayer({
          id: "hatch",
          type: "fill",
          source: "hex",
          paint: {
            "fill-pattern": "ci-hatch",
            "fill-opacity": [
              "case",
              ["boolean", ["feature-state", "hatch"], false],
              0.45,
              0,
            ],
          },
        })
        map.addLayer({
          id: "line",
          type: "line",
          source: "hex",
          paint: strokePaint(),
        })
        attach()
        if (!interactive) return
        let hoverId: string | null = null
        const setHexHover = (id: string | null) => {
          if (!map) return
          if (hoverId) {
            map.setFeatureState({ source: "hex", id: hoverId }, { hover: false })
          }
          hoverId = id
          if (id) map.setFeatureState({ source: "hex", id }, { hover: true })
        }
        map.on("mousemove", "fill", (event) => {
          map!.getCanvas().style.cursor = "pointer"
          const feature = event.features?.[0]
          const code = String(feature?.properties?.code ?? "")
          const name = String(feature?.properties?.name ?? "")
          const id = String(feature?.properties?.id ?? feature?.id ?? "")
          if (!code) return
          setHexHover(id)
          setHover({ code, name, x: event.point.x, y: event.point.y })
        })
        map.on("mouseleave", "fill", () => {
          map!.getCanvas().style.cursor = ""
          setHexHover(null)
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
      cancelAnimationFrame(rafRef.current)
      observer.disconnect()
      window.visualViewport?.removeEventListener("resize", onViewport)
      window.removeEventListener("orientationchange", onViewport)
      map?.remove()
      mapRef.current = null
    }
  }, [geojson, hexField, interactive])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    cancelAnimationFrame(rafRef.current)
    const cue = cueRef.current
    let duration = 0
    if (view && view !== cue.view) duration = motionMs(240)
    else if (year && year !== cue.year) duration = motionMs(180)
    cueRef.current = { year, view }
    if (map.getLayer("line")) {
      const stroke = strokePaint(view)
      map.setPaintProperty("line", "line-color", stroke["line-color"])
      map.setPaintProperty("line", "line-width", stroke["line-width"])
      map.setPaintProperty("line", "line-opacity", stroke["line-opacity"])
    }
    const from = paintedRef.current
    if (!duration) {
      paint(map, hexField, colours, selected, hatch)
      paintedRef.current = colours
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) * (1 - t)
      const mid: Record<string, string> = {}
      const codes = new Set([...Object.keys(from), ...Object.keys(colours)])
      for (const code of codes) {
        mid[code] = mixColour(from[code] ?? NO_DATA, colours[code] ?? NO_DATA, eased)
      }
      paint(map, hexField, mid, selected, hatch)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else paintedRef.current = colours
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [colours, hatch, selected, hexField, year, view])

  const tooltipStyle = hover
    ? {
        left: Math.max(8, Math.min(hover.x + 12, size.width - 168)),
        top: Math.max(8, Math.min(hover.y + 12, size.height - 148)),
      }
    : undefined

  return (
    <div
      className={cn(
        "relative h-full min-h-[240px] w-full max-w-full overflow-hidden bg-[#f8fafc]",
        interactive ? "rounded-lg" : "rounded-none",
        enterMs && ready ? "hero-map-enter" : "",
        className
      )}
    >
      {!ready ? (
        <div className="absolute inset-0 animate-pulse bg-[#f8fafc]">
          <div className="absolute inset-[12%] rounded-[40%] border border-slate-300/70" />
        </div>
      ) : null}
      <div ref={containerRef} className="absolute inset-0 h-full w-full max-w-full" />
      {interactive && hover && !quietHover ? (
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

function strokePaint(view?: string): {
  "line-color": maplibregl.ExpressionSpecification
  "line-width": maplibregl.ExpressionSpecification
  "line-opacity": number
} {
  const lift =
    view === "d2017" || view === "d2019" || view === "vs_nation" || view === "sex_gap"
      ? "#334155"
      : "#134e4a"
  const active: maplibregl.ExpressionSpecification = [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "selected"], false],
  ]
  return {
    "line-color": ["case", active, lift, INTERNAL_STROKE],
    "line-width": ["case", active, 1, 0.6],
    "line-opacity": 0.42,
  }
}

function paint(
  map: maplibregl.Map,
  hexField: FeatureCollection,
  colours: Record<string, string>,
  selected: string | null,
  hatch?: Record<string, boolean>
) {
  if (!map.getSource("hex")) return
  for (const feature of hexField.features) {
    const id = String(feature.properties?.id ?? feature.id ?? "")
    const code = String(feature.properties?.code ?? "")
    if (!id || !code) continue
    map.setFeatureState(
      { source: "hex", id },
      {
        colour: colours[code] ?? NO_DATA,
        selected: code === selected,
        hatch: Boolean(hatch?.[code]),
      }
    )
  }
}

function hatchPattern(): { width: number; height: number; data: Uint8Array } {
  const width = 8
  const height = 8
  const data = new Uint8Array(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const on = (x + y) % 8 <= 1
      const i = (y * width + x) * 4
      data[i] = 15
      data[i + 1] = 23
      data[i + 2] = 42
      data[i + 3] = on ? 170 : 0
    }
  }
  return { width, height, data }
}
