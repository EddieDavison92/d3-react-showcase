"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import type { FeatureCollection } from "geojson"
import { boundsOfGeojson } from "@/components/explorer/map-helpers"
import {
  mixRgb,
  motionMs,
  NO_DATA,
  rgbLookup,
  rgbToHex,
  toRgb,
  type Rgb,
} from "@/lib/explorer/colours"
import { cn } from "@/lib/utils"

type HoverInfo = { code: string; name: string; x: number; y: number }

const UK_BOUNDS: [[number, number], [number, number]] = [
  [-8.6, 49.8],
  [1.9, 59.5],
]

const SOURCE = "areas"
const MIN_SIZE = 24
const BOUNDARY_STROKE = "#f4f4f0"
const SELECTED_STROKE = "#111315"
const SCRUB_MS = 200
const FLIP_MS = 260
const NO_DATA_RGB: Rgb = [221, 220, 213]
// No figure = unfilled area (outline only), so it never reads as a value near zero.
const FILL_OPACITY: maplibregl.ExpressionSpecification = [
  "case",
  ["boolean", ["feature-state", "nodata"], false],
  0,
  ["boolean", ["feature-state", "hatch"], false],
  0.58,
  0.96,
]
const INSTANT_PAINT = { duration: 0, delay: 0 }

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
  background = "#f4f4f0",
  fitPadding,
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
  /** Canvas ground; the landing hero floats on the page ground instead of a panel. */
  background?: string
  /** Space to keep clear when fitting, e.g. under floating panels. */
  fitPadding?: maplibregl.PaddingOptions
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  const coloursRef = useRef(colours)
  const hatchRef = useRef(hatch)
  const selectedRef = useRef(selected)
  const cueRef = useRef({ year, view })
  const displayedRef = useRef<Record<string, string>>({})
  const targetRef = useRef<Record<string, string>>({})
  const rafRef = useRef(0)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [size, setSize] = useState({ width: 320, height: 240 })
  const [ready, setReady] = useState(false)

  const paddingRef = useRef(fitPadding)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    paddingRef.current = fitPadding
  }, [fitPadding])

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
    const padding = () => paddingRef.current ?? (interactive ? 28 : 36)

    const fit = () => {
      if (!map || userMoved || cancelled) return
      map.resize()
      if (el.clientWidth < MIN_SIZE || el.clientHeight < MIN_SIZE) return
      const bounds = boundsOfGeojson(geojson) ?? UK_BOUNDS
      fitting = true
      map.fitBounds(bounds, { padding: padding(), duration: 0, maxZoom: 8 })
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
      if (!map?.getSource(SOURCE)) return
      const shown = Object.keys(displayedRef.current).length
        ? displayedRef.current
        : coloursRef.current
      paint(map, geojson, shown, selectedRef.current, hatchRef.current)
      if (!Object.keys(displayedRef.current).length) {
        displayedRef.current = { ...shown }
        targetRef.current = { ...shown }
      }
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
              paint: { "background-color": background },
            },
          ],
        },
        bounds: featureBounds,
        fitBoundsOptions: { padding: padding(), duration: 0 },
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
        map.addSource(SOURCE, {
          type: "geojson",
          data: geojson,
          promoteId: "code",
        })
        // Selected area: a paper halo under the fills, and an ink ring above.
        map.addLayer({
          id: "selected-halo",
          type: "line",
          source: SOURCE,
          layout: { "line-join": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 7, 0],
          },
        })
        map.addLayer({
          id: "fill",
          type: "fill",
          source: SOURCE,
          paint: {
            "fill-color": [
              "rgb",
              ["coalesce", ["feature-state", "r"], NO_DATA_RGB[0]],
              ["coalesce", ["feature-state", "g"], NO_DATA_RGB[1]],
              ["coalesce", ["feature-state", "b"], NO_DATA_RGB[2]],
            ],
            "fill-opacity": FILL_OPACITY,
          },
        })
        // Feature-state updates must land immediately; we lerp fills in JS.
        map.setPaintProperty("fill", "fill-color-transition", INSTANT_PAINT)
        map.setPaintProperty("fill", "fill-opacity-transition", INSTANT_PAINT)
        map.addLayer({
          id: "hatch",
          type: "fill",
          source: SOURCE,
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
          source: SOURCE,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: strokePaint(),
        })
        map.addLayer({
          id: "selected-ring",
          type: "line",
          source: SOURCE,
          layout: { "line-join": "round" },
          paint: {
            "line-color": SELECTED_STROKE,
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.5, 0],
          },
        })
        attach()
        if (!interactive) return
        let hoverId: string | null = null
        const setAreaHover = (id: string | null) => {
          if (!map) return
          if (hoverId) {
            map.setFeatureState({ source: SOURCE, id: hoverId }, { hover: false })
          }
          hoverId = id
          if (id) map.setFeatureState({ source: SOURCE, id }, { hover: true })
        }
        map.on("mousemove", "fill", (event) => {
          map!.getCanvas().style.cursor = "pointer"
          const feature = event.features?.[0]
          const code = String(feature?.properties?.code ?? feature?.id ?? "")
          const name = String(feature?.properties?.name ?? "")
          if (!code) return
          setAreaHover(code)
          setHover({ code, name, x: event.point.x, y: event.point.y })
        })
        map.on("mouseleave", "fill", () => {
          map!.getCanvas().style.cursor = ""
          setAreaHover(null)
          setHover(null)
        })
        map.on("click", "fill", (event) => {
          const feature = event.features?.[0]
          const code = String(feature?.properties?.code ?? feature?.id ?? "")
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
      displayedRef.current = {}
      targetRef.current = {}
      setReady(false)
    }
  }, [background, geojson, interactive])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.isStyleLoaded() || !map.getLayer("fill")) return
    const hasPainted = Object.keys(displayedRef.current).length > 0
    const targetChanged = hasPainted && !sameColours(targetRef.current, colours)
    const viewFlipped = Boolean(view && view !== cueRef.current.view)
    cueRef.current = { year, view }

    if (!hasPainted) {
      paint(map, geojson, colours, selectedRef.current, hatchRef.current)
      displayedRef.current = { ...colours }
      targetRef.current = { ...colours }
      return
    }
    if (!targetChanged) return

    cancelAnimationFrame(rafRef.current)
    const duration = viewFlipped ? motionMs(FLIP_MS) : motionMs(SCRUB_MS)
    const fromRgb = rgbLookup(displayedRef.current)
    const toRgb = rgbLookup(colours)
    targetRef.current = { ...colours }
    if (!duration) {
      paint(map, geojson, colours, selectedRef.current, hatchRef.current)
      displayedRef.current = { ...colours }
      return
    }

    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / duration)
      const mixed: Record<string, string> = {}
      for (const code of Object.keys(toRgb)) {
        mixed[code] = rgbToHex(mixRgb(fromRgb[code] ?? NO_DATA_RGB, toRgb[code], t))
      }
      paint(map, geojson, mixed, selectedRef.current, hatchRef.current, colours)
      displayedRef.current = mixed
      map.triggerRepaint()
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [colours, geojson, year, view, ready])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map?.isStyleLoaded() || !map.getLayer("fill")) return
    if (map.getLayer("line")) {
      const stroke = strokePaint(view)
      map.setPaintProperty("line", "line-color", stroke["line-color"])
      map.setPaintProperty("line", "line-width", stroke["line-width"])
      map.setPaintProperty("line", "line-opacity", stroke["line-opacity"])
    }
    const shown = Object.keys(displayedRef.current).length
      ? displayedRef.current
      : colours
    paint(map, geojson, shown, selected, hatch, colours)
  }, [colours, hatch, selected, geojson, view, ready])

  const tooltipStyle = hover
    ? {
        left: Math.max(8, Math.min(hover.x + 12, size.width - 168)),
        top: Math.max(8, Math.min(hover.y + 12, size.height - 148)),
      }
    : undefined

  return (
    <div
      style={{ background }}
      className={cn(
        "relative h-full min-h-[240px] w-full max-w-full overflow-hidden",
        interactive ? "rounded-lg" : "rounded-none",
        enterMs && ready ? "hero-map-enter" : "",
        className
      )}
    >
      {!ready ? (
        <div className="absolute inset-0 animate-pulse" style={{ background }}>
        </div>
      ) : null}
      <div ref={containerRef} className="absolute inset-0 h-full w-full max-w-full" />
      {interactive && hover && !quietHover ? (
        <div
          className="pointer-events-none absolute z-10 max-w-[min(100%-1rem,18rem)] rounded-lg border border-line bg-white px-3 py-2 text-xs leading-relaxed text-ink-2 shadow-[0_12px_32px_-16px_rgba(17,19,21,0.45)]"
          style={tooltipStyle}
        >
          {formatHover(hover.code, hover.name)
            .split(/\n/)
            .map((line, i) => (
              <p key={i} className={i === 0 ? "text-[13px] font-semibold text-ink" : "tabular"}>
                {line}
              </p>
            ))}
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
      ? "#111315"
      : "#111315"
  const active: maplibregl.ExpressionSpecification = [
    "any",
    ["boolean", ["feature-state", "hover"], false],
    ["boolean", ["feature-state", "selected"], false],
  ]
  return {
    "line-color": ["case", active, lift, BOUNDARY_STROKE],
    "line-width": ["case", active, 1.4, 0.6],
    "line-opacity": 0.95,
  }
}

function paint(
  map: maplibregl.Map,
  areas: FeatureCollection,
  colours: Record<string, string>,
  selected: string | null,
  hatch?: Record<string, boolean>,
  target: Record<string, string> = colours
) {
  if (!map.getSource(SOURCE)) return
  for (const feature of areas.features) {
    const code = String(feature.properties?.code ?? "")
    if (!code) continue
    const rgb = toRgb(colours[code] ?? NO_DATA)
    map.setFeatureState(
      { source: SOURCE, id: code },
      {
        r: Math.round(rgb[0]),
        g: Math.round(rgb[1]),
        b: Math.round(rgb[2]),
        selected: code === selected,
        hatch: Boolean(hatch?.[code]),
        nodata: !target[code] || target[code] === NO_DATA,
      }
    )
  }
}

function sameColours(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = Object.keys(b)
  if (Object.keys(a).length !== keys.length) return false
  for (const key of keys) {
    if (a[key] !== b[key]) return false
  }
  return true
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
