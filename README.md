# Life expectancy explorer

A data-first navigator over ONS period life expectancy for UK local areas, with separate catalogue cards for healthy life expectancy, avoidable mortality (England and Wales), and nation-specific deprivation context.

This is not official ONS software. Statistics and boundaries are reused under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

## Product

- **Landing** — careful framing of period LE
- **Catalogue** — metric-family cards with coverage badges
- **Explore** — catalogue rail, MapLibre choropleth, canvas Explore modes, time series and period scrub
- URL state: `?metric=&geo=&area=&year=&sex=&age=&view=`

Default cut: period LE → lower-tier UK local areas → 2022–24 → male → at birth. Explore modes (`?view=`): Absolute (omit or `absolute`), Δ 2017–19 (`d2017`), Δ 2019–21 (`d2019`), vs nation (`vs_nation`), sex gap (`sex_gap`, Male − Female derived), CI focus (`ci`).

England counties (E10) are a separate geography from districts. Healthy life expectancy is upper-tier in England (no E07 districts). Avoidable mortality does not invent Scotland or Northern Ireland coverage. Deprivation is a nation-locked context strip, not a cause, and is never a UK league table.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run build
```

Processed JSON lives in `public/data/`. Simplified ONS Open Geography BUC boundaries live in `public/geo/`. Rebuild with:

```bash
python3 scripts/build-explorer-data.py
```

Requires the original extracts in `uploads/` (or `$EXPLORER_UPLOADS`). Optional IoD markdown fallback: `$EXPLORER_IOD_MARKDOWN` (default `uploads/iod.md`). Processed JSON is committed under `public/data/`, so a normal checkout does not need a rebuild.
