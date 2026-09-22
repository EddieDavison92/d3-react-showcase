import type { Feature, FeatureCollection, Geometry, Position } from "geojson"
import proj4 from "proj4"

/**
 * Equal-area hex field over the active geography.
 * Centres sit on a Lambert azimuthal equal-area grid (UK). A hex is kept when
 * its centre falls inside an area polygon and inherits that area’s code.
 * Cells are drawn inset so they float with hairline gaps — not a cartogram.
 */
const LAEA =
  "+proj=laea +lat_0=54.2 +lon_0=-2.4 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
const WGS84 = "EPSG:4326"
const INSET = 0.86
const TARGET_ROWS = 110
const INDEX_CELL = 40_000
const MIN_RADIUS = 5_000

type AreaPoly = {
  code: string
  name: string
  minX: number
  minY: number
  maxX: number
  maxY: number
  polygons: Position[][][]
}

type Pt = [number, number]

export function buildHexField(geojson: FeatureCollection): FeatureCollection {
  const areas = projectAreas(geojson.features)
  if (!areas.length) return empty()

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const area of areas) {
    minX = Math.min(minX, area.minX)
    minY = Math.min(minY, area.minY)
    maxX = Math.max(maxX, area.maxX)
    maxY = Math.max(maxY, area.maxY)
  }

  const height = Math.max(1, maxY - minY)
  const radius = Math.max(MIN_RADIUS, height / (1.5 * TARGET_ROWS))
  const index = indexAreas(areas)
  const w = Math.sqrt(3) * radius
  const h = 1.5 * radius
  const drawR = radius * INSET
  const features: Feature[] = []
  const covered = new Set<string>()
  let row = 0

  for (let cy = minY - radius * 0.2; cy <= maxY + radius * 0.2; cy += h, row += 1) {
    const odd = row % 2 === 1
    const x0 = minX - radius * 0.2 + (odd ? w / 2 : 0)
    let col = 0
    for (let cx = x0; cx <= maxX + radius * 0.2; cx += w, col += 1) {
      const hit = areaAt(cx, cy, index)
      if (!hit) continue
      covered.add(hit.code)
      features.push(hexFeature(`h${row}-${col}`, hit.code, hit.name, cx, cy, drawR))
    }
  }

  let extra = 0
  for (const area of areas) {
    if (covered.has(area.code)) continue
    const centre = representativePoint(area)
    if (!centre) continue
    extra += 1
    features.push(
      hexFeature(`c${extra}-${area.code}`, area.code, area.name, centre[0], centre[1], drawR)
    )
  }

  return { type: "FeatureCollection", features }
}

function empty(): FeatureCollection {
  return { type: "FeatureCollection", features: [] }
}

function hexFeature(
  id: string,
  code: string,
  name: string,
  cx: number,
  cy: number,
  radius: number
): Feature {
  const ring = hexRing(cx, cy, radius).map(toLonLat)
  ring.push(ring[0])
  return {
    type: "Feature",
    id,
    properties: { id, code, name },
    geometry: { type: "Polygon", coordinates: [ring] },
  }
}

function representativePoint(area: AreaPoly): Pt | null {
  const cx = (area.minX + area.maxX) / 2
  const cy = (area.minY + area.maxY) / 2
  if (pointInArea(cx, cy, area.polygons)) return [cx, cy]
  const ring = area.polygons[0]?.[0]
  if (!ring?.length) return null
  const steps = 7
  const dx = (area.maxX - area.minX) / (steps + 1)
  const dy = (area.maxY - area.minY) / (steps + 1)
  for (let i = 1; i <= steps; i += 1) {
    for (let j = 1; j <= steps; j += 1) {
      const x = area.minX + dx * i
      const y = area.minY + dy * j
      if (pointInArea(x, y, area.polygons)) return [x, y]
    }
  }
  const n = ring.length - 1
  let sx = 0
  let sy = 0
  for (let i = 0; i < n; i += 1) {
    sx += ring[i][0]
    sy += ring[i][1]
  }
  return [sx / Math.max(1, n), sy / Math.max(1, n)]
}

function projectAreas(features: Feature[]): AreaPoly[] {
  const out: AreaPoly[] = []
  for (const feature of features) {
    const code = String(feature.properties?.code ?? "")
    const name = String(feature.properties?.name ?? code)
    if (!code || !feature.geometry) continue
    const polygons = polygonsOf(feature.geometry).map((rings) =>
      rings.map((ring) => ring.map(toMetres))
    )
    if (!polygons.length) continue
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const rings of polygons) {
      for (const ring of rings) {
        for (const [x, y] of ring) {
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }
    out.push({ code, name, minX, minY, maxX, maxY, polygons })
  }
  return out
}

function indexAreas(areas: AreaPoly[]): Map<string, AreaPoly[]> {
  const index = new Map<string, AreaPoly[]>()
  for (const area of areas) {
    const x0 = Math.floor(area.minX / INDEX_CELL)
    const x1 = Math.floor(area.maxX / INDEX_CELL)
    const y0 = Math.floor(area.minY / INDEX_CELL)
    const y1 = Math.floor(area.maxY / INDEX_CELL)
    for (let ix = x0; ix <= x1; ix += 1) {
      for (let iy = y0; iy <= y1; iy += 1) {
        const key = `${ix}:${iy}`
        const bucket = index.get(key)
        if (bucket) bucket.push(area)
        else index.set(key, [area])
      }
    }
  }
  return index
}

function areaAt(x: number, y: number, index: Map<string, AreaPoly[]>): AreaPoly | null {
  const bucket = index.get(`${Math.floor(x / INDEX_CELL)}:${Math.floor(y / INDEX_CELL)}`)
  if (!bucket) return null
  for (const area of bucket) {
    if (x < area.minX || x > area.maxX || y < area.minY || y > area.maxY) continue
    if (pointInArea(x, y, area.polygons)) return area
  }
  return null
}

function pointInArea(x: number, y: number, polygons: Position[][][]): boolean {
  for (const rings of polygons) {
    if (!rings.length) continue
    if (!pointInRing(x, y, rings[0])) continue
    let hole = false
    for (let i = 1; i < rings.length; i += 1) {
      if (pointInRing(x, y, rings[i])) {
        hole = true
        break
      }
    }
    if (!hole) return true
  }
  return false
}

function pointInRing(x: number, y: number, ring: Position[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const crosses = yi > y !== yj > y
    if (crosses && x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi) {
      inside = !inside
    }
  }
  return inside
}

function polygonsOf(geometry: Geometry): Position[][][] {
  if (geometry.type === "Polygon") return [geometry.coordinates]
  if (geometry.type === "MultiPolygon") return geometry.coordinates
  return []
}

function hexRing(cx: number, cy: number, radius: number): Pt[] {
  const ring: Pt[] = []
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30)
    ring.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
  }
  return ring
}

function toMetres(pos: Position): Pt {
  return proj4(WGS84, LAEA, [pos[0], pos[1]]) as Pt
}

function toLonLat(pt: Pt): Pt {
  return proj4(LAEA, WGS84, pt) as Pt
}
