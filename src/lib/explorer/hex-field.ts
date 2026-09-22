import type { Feature, FeatureCollection, Geometry, Position } from "geojson"
import proj4 from "proj4"

/**
 * One equal-area hex per area, snapped to a Lambert azimuthal lattice
 * centred on the UK. A cell starts at the polygon’s representative point;
 * collisions walk to the nearest empty lattice cell. Drawn inset so the
 * field floats — not a statistical hexbin and not a cartogram of tiles.
 */
const LAEA =
  "+proj=laea +lat_0=54.2 +lon_0=-2.4 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
const WGS84 = "EPSG:4326"
const INSET = 0.9
const AXIAL: Pt[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
]

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

  const centres: { area: AreaPoly; x: number; y: number }[] = []
  for (const area of areas) {
    const point = representativePoint(area)
    if (point) centres.push({ area, x: point[0], y: point[1] })
  }
  if (!centres.length) return empty()

  const size = latticeSize(centres)
  const drawR = size * INSET
  const taken = new Set<string>()
  const features: Feature[] = []

  centres.sort((a, b) => b.y - a.y || a.x - b.x)
  for (const item of centres) {
    const home = pixelToHex(item.x, item.y, size)
    const cell = firstEmpty(home[0], home[1], taken)
    taken.add(`${cell[0]}:${cell[1]}`)
    const [cx, cy] = hexToPixel(cell[0], cell[1], size)
    features.push(
      hexFeature(item.area.code, item.area.code, item.area.name, cx, cy, drawR)
    )
  }

  return { type: "FeatureCollection", features }
}

function latticeSize(centres: { x: number; y: number }[]): number {
  const distances: number[] = []
  for (let i = 0; i < centres.length; i += 1) {
    let best = Infinity
    for (let j = 0; j < centres.length; j += 1) {
      if (i === j) continue
      const dx = centres[i].x - centres[j].x
      const dy = centres[i].y - centres[j].y
      const d = Math.hypot(dx, dy)
      if (d < best) best = d
    }
    if (Number.isFinite(best)) distances.push(best)
  }
  distances.sort((a, b) => a - b)
  const median = distances[Math.floor(distances.length / 2)] || 12_000
  return Math.max(10_000, Math.min(24_000, median / Math.sqrt(3)))
}

function pixelToHex(x: number, y: number, size: number): Pt {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size
  const r = ((2 / 3) * y) / size
  return cubeRound(q, r)
}

function hexToPixel(q: number, r: number, size: number): Pt {
  return [size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r), size * (1.5 * r)]
}

function cubeRound(q: number, r: number): Pt {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  let rs = Math.round(s)
  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) rq = -rr - rs
  else if (dr > ds) rr = -rq - rs
  return [rq, rr]
}

function firstEmpty(q0: number, r0: number, taken: Set<string>): Pt {
  if (!taken.has(`${q0}:${r0}`)) return [q0, r0]
  for (let ring = 1; ring <= 48; ring += 1) {
    let q = q0 + AXIAL[4][0] * ring
    let r = r0 + AXIAL[4][1] * ring
    for (const [dq, dr] of AXIAL) {
      for (let step = 0; step < ring; step += 1) {
        if (!taken.has(`${q}:${r}`)) return [q, r]
        q += dq
        r += dr
      }
    }
  }
  return [q0, r0]
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
  const n = Math.max(1, ring.length - 1)
  let sx = 0
  let sy = 0
  for (let i = 0; i < n; i += 1) {
    sx += ring[i][0]
    sy += ring[i][1]
  }
  return [sx / n, sy / n]
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
