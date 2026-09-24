# Ten years apart

How long people live across the UK's local authorities, how progress stalled after 2011, and how the gap between places has grown. Live at [life-expectancy-uk.vercel.app](https://life-expectancy-uk.vercel.app/).

Statistics and boundaries are reused under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

## Pages

- **Story** (`/`): a scrolling data essay. 359 dots, one per local authority, move between a hex map, a ranking and deprivation groups; then the stall since 2011, the widening deprivation gap, healthy years, and the local circumstances that travel with life expectancy. Every number is computed from the data at build time.
- **Area reports** (`/area/[code]`): a statically generated page for every local authority and English county.
- **Atlas** (`/explore`): full-screen map of every measure and period, with a histogram legend and period player.
- **Evidence** (`/evidence`): the deprivation gradient, correlation of 15 OHID indicators with life expectancy, and a scatter per indicator.
- **Methods** (`/about`): sources and calculations.

Atlas URL state: `?metric=&geo=&area=&year=&sex=&age=&view=`.

## Data

| File | Source | Build |
| --- | --- | --- |
| `public/data/le.json`, `hle.json`, `avoidable.json`, `deprivation.json`, `lookups.json` | ONS, MHCLG | `scripts/build-explorer-data.py` (needs the original extracts in `uploads/`) |
| `public/data/evidence.json` | OHID Fingertips API, England only | `python scripts/build-evidence-data.py` |
| `public/data/hex.json` | Open Innovations hex map (MIT) | `python scripts/build-hex-layout.py` |
| `public/geo/*.geojson` | ONS Open Geography, simplified | `scripts/build-explorer-data.py` |

Processed JSON is committed, so a normal checkout doesn't need a rebuild. The evidence script caches raw CSVs in `.cache/ft`; delete it to refresh.

## Develop

```bash
npm install
npm run dev
npm run lint
npm run build
```
