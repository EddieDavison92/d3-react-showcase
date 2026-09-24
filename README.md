# UK life expectancy

Life expectancy for every UK local authority, with healthy life expectancy, avoidable deaths and the local conditions that track them. Live at [life-expectancy-uk.vercel.app](https://life-expectancy-uk.vercel.app/).

Not an official ONS product. Statistics and boundaries are reused under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

## Pages

- **Home** — headline gaps computed from the data at build time
- **Map** (`/explore`) — choropleth, period slider, and an area panel with rank, trend, healthy years, deprivation and risk factors
- **Evidence** (`/evidence`) — life expectancy by deprivation tenth, correlation of 15 OHID indicators with life expectancy, and a scatter per indicator
- **About** — sources, methods and indicator periods

Map URL state: `?metric=&geo=&area=&year=&sex=&age=&view=`. Views: `absolute` (default), `d2017`, `d2019`, `vs_nation`, `sex_gap`, `ci`.

## Data

| File | Source | Build |
| --- | --- | --- |
| `public/data/le.json`, `hle.json`, `avoidable.json`, `deprivation.json`, `lookups.json` | ONS, MHCLG | `scripts/build-explorer-data.py` (needs the original extracts in `uploads/`) |
| `public/data/evidence.json` | OHID Fingertips API, England only | `python scripts/build-evidence-data.py` |
| `public/geo/*.geojson` | ONS Open Geography, simplified | `scripts/build-explorer-data.py` |

Processed JSON is committed, so a normal checkout doesn't need a rebuild. The evidence script caches raw CSVs in `.cache/ft`; delete it to refresh.

## Develop

```bash
npm install
npm run dev
npm run lint
npm run build
```
